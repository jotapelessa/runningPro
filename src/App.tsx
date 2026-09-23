import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RunnerState, DailyRecoveryCheckin, TestRecord, TrainingPlan, AppTab, ParsedWorkout, UserActivity } from './types';
import { 
  loadRunnerState, 
  saveRunnerState, 
  loadTestHistory, 
  saveTestHistory, 
  loadTrainingPlan, 
  saveTrainingPlan, 
  loadRecoveryLogs, 
  saveRecoveryLogs,
  resetAllAppData
} from './lib/storage';
import { loadUserActivities, saveUserActivities, deduplicateOrMergeActivity } from './lib/activitiesStorage';
import { generateEightWeekPlan } from './lib/planGenerator';
import { reconcilePlanWithActivities, calibrateRunnerFromActivities } from './lib/planReconciler';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivitiesTab } from './components/ActivitiesTab';
import { VdotCalculatorTab } from './components/VdotCalculatorTab';
import { RacePredictionsTab } from './components/RacePredictionsTab';
import { TrainingPlanTab } from './components/TrainingPlanTab';
import { AthleteRecoveryTab } from './components/AthleteRecoveryTab';
import { RacesTab } from './components/RacesTab';
import { WorkoutImporter } from './components/WorkoutImporter';
import { GuideTab } from './components/GuideTab';
import { AthleteModal } from './components/AthleteModal';
import { CoachChat } from './components/CoachChat';
import { QuickPaceConverterModal } from './components/QuickPaceConverterModal';
import { CadenceMetronomeModal } from './components/CadenceMetronomeModal';
import { WristbandModal } from './components/WristbandModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { PhysiologicalDiagnosisModal } from './components/PhysiologicalDiagnosisModal';
import { getTabFromPathname, syncPathWithTab } from './lib/router';
import { Zap, Heart, ShieldCheck, Flame } from 'lucide-react';

export default function App() {
  const [runnerState, setRunnerState] = useState<RunnerState>(() => loadRunnerState());
  const [testHistory, setTestHistory] = useState<TestRecord[]>(() => loadTestHistory());
  const [plan, setPlan] = useState<TrainingPlan>(() => loadTrainingPlan(runnerState.name, runnerState.currentVdot));
  const [recoveryLogs, setRecoveryLogs] = useState<DailyRecoveryCheckin[]>(() => loadRecoveryLogs());
  const [activities, setActivities] = useState<UserActivity[]>(() => loadUserActivities());

  const initialRoute = getTabFromPathname();
  const [activeTab, setActiveTabState] = useState<AppTab>(() => initialRoute.tab);

  // Modals
  const [isAthleteModalOpen, setIsAthleteModalOpenState] = useState<boolean>(() => initialRoute.openModal === 'atleta');
  const [isPaceModalOpen, setIsPaceModalOpenState] = useState<boolean>(() => initialRoute.openModal === 'calculadora');
  const [isMetronomeModalOpen, setIsMetronomeModalOpenState] = useState<boolean>(() => initialRoute.openModal === 'metronomo');
  const [isWristbandModalOpen, setIsWristbandModalOpenState] = useState<boolean>(() => initialRoute.openModal === 'pulseira');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState<boolean>(false);
  const [diagnosedWorkout, setDiagnosedWorkout] = useState<ParsedWorkout | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Synchronized activeTab setter that keeps browser URL in sync
  const setActiveTab = (tab: AppTab) => {
    setActiveTabState(tab);
    syncPathWithTab(tab);
  };

  const setIsAthleteModalOpen = (open: boolean) => {
    setIsAthleteModalOpenState(open);
    syncPathWithTab(activeTab, open ? 'atleta' : undefined);
  };

  const setIsPaceModalOpen = (open: boolean) => {
    setIsPaceModalOpenState(open);
    syncPathWithTab(activeTab, open ? 'calculadora' : undefined);
  };

  const setIsMetronomeModalOpen = (open: boolean) => {
    setIsMetronomeModalOpenState(open);
    syncPathWithTab(activeTab, open ? 'metronomo' : undefined);
  };

  const setIsWristbandModalOpen = (open: boolean) => {
    setIsWristbandModalOpenState(open);
    syncPathWithTab(activeTab, open ? 'pulseira' : undefined);
  };


  // Listen to browser Back/Forward (popstate)
  React.useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/atividades');
    }

    const handlePopState = () => {
      const current = getTabFromPathname();
      setActiveTabState(current.tab);
      setIsMetronomeModalOpenState(current.openModal === 'metronomo');
      setIsPaceModalOpenState(current.openModal === 'calculadora');
      setIsWristbandModalOpenState(current.openModal === 'pulseira');
      setIsAthleteModalOpenState(current.openModal === 'atleta');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reconcile plan and calibrate on initial startup if activities exist
  React.useEffect(() => {
    if (activities && activities.length > 0) {
      setRunnerState(prev => {
        const calib = calibrateRunnerFromActivities(prev, activities);
        if (calib.calibrated) {
          const next = { ...prev, ...calib.updatedRunnerState };
          saveRunnerState(next);
          return next;
        }
        return prev;
      });

      setPlan(prevPlan => {
        if (!prevPlan || !prevPlan.weeks) return prevPlan;
        const rec = reconcilePlanWithActivities(prevPlan, activities);
        if (rec.matchedCount > 0) {
          saveTrainingPlan(rec.updatedPlan);
          return rec.updatedPlan;
        }
        return prevPlan;
      });
    }
  }, []);

  // Sync to local storage
  const handleUpdateRunnerState = (updatedFields: Partial<RunnerState>) => {
    setRunnerState(prev => {
      const next = { ...prev, ...updatedFields };
      saveRunnerState(next);
      return next;
    });

    // We use the updated fields merged with current state (which we can approximate since it's synchronous logic)
    // Actually, to be safe from stale closures, we can just queue the plan update based on the latest state
    // but the easiest is to compute next here.
    const nextState = { ...runnerState, ...updatedFields };

    if (
      updatedFields.currentVdot !== undefined || 
      updatedFields.trainingDays !== undefined || 
      updatedFields.targetRaceDistance !== undefined ||
      updatedFields.name !== undefined
    ) {
      const validGoal = (['5k', '10k', '21k', '42k', 'base'].includes(nextState.targetRaceDistance as any)
        ? nextState.targetRaceDistance
        : '10k') as '5k' | '10k' | '21k' | '42k' | 'base';

      const updatedPlan = generateEightWeekPlan(
        nextState.name || 'Corredor PaceLab',
        nextState.currentVdot && nextState.currentVdot > 0 ? nextState.currentVdot : 40.0,
        validGoal,
        (nextState.trainingDays && nextState.trainingDays >= 3 && nextState.trainingDays <= 6 ? nextState.trainingDays : 4) as 3 | 4 | 5 | 6
      );
      setPlan(updatedPlan);
      saveTrainingPlan(updatedPlan);
    }
  };

  const handleAddTestRecord = (newTest: TestRecord) => {
    const updated = [newTest, ...testHistory];
    setTestHistory(updated);
    saveTestHistory(updated);
  };

  const handleUpdatePlan = (newPlan: TrainingPlan) => {
    setPlan(newPlan);
    saveTrainingPlan(newPlan);
  };

  const handleAddRecoveryLog = (newLog: DailyRecoveryCheckin) => {
    const updated = [newLog, ...recoveryLogs];
    setRecoveryLogs(updated);
    saveRecoveryLogs(updated);
  };

  const handleUpdateActivities = (newActivities: UserActivity[]) => {
    setActivities(newActivities);
    saveUserActivities(newActivities);

    // 1. Calibração adaptativa dos dados do atleta a partir das atividades reais
    setRunnerState(prev => {
      const calib = calibrateRunnerFromActivities(prev, newActivities);
      if (calib.calibrated) {
        const nextState = { ...prev, ...calib.updatedRunnerState };
        saveRunnerState(nextState);
        return nextState;
      }
      return prev;
    });

    // 2. Reconciliação e ajuste dinâmico do calendário/planilha
    setPlan(prevPlan => {
      if (!prevPlan || !prevPlan.weeks) return prevPlan;
      const rec = reconcilePlanWithActivities(prevPlan, newActivities);
      if (rec.matchedCount > 0 || rec.overloadDetected) {
        saveTrainingPlan(rec.updatedPlan);
        return rec.updatedPlan;
      }
      return prevPlan;
    });
  };

  // Reset entire application data
  const handleResetAll = () => {
    const resetResult = resetAllAppData();
    setRunnerState(resetResult.runnerState);
    setTestHistory(resetResult.testHistory);
    setPlan(resetResult.trainingPlan);
    setRecoveryLogs(resetResult.recoveryLogs);
    setActivities(resetResult.activities || []);
    setIsResetModalOpen(false);
    setActiveTab('atividades');
  };

  // Handle GPX/TCX Workout Calibration
  const handleApplyWorkout = (workout: ParsedWorkout) => {
    const newVdot = workout.vdot;
    const maxHr = workout.maxHR || runnerState.macHR || runnerState.maxHr || 188;

    const updatedRunner: Partial<RunnerState> = {
      currentVdot: newVdot,
      currentVo2max: newVdot,
      isCalibrated: true,
      calibrationSource: `Arquivo: ${workout.fileName}`,
      macHR: maxHr,
      maxHr: maxHr,
    };

    if (workout.avgCadence) {
      updatedRunner.cadenceSpm = workout.avgCadence;
    }

    handleUpdateRunnerState(updatedRunner);

    // Add to test history as a calibrated record
    const newTest: TestRecord = {
      id: `test-${Date.now()}`,
      date: workout.date || new Date().toISOString().split('T')[0],
      distanceId: workout.distanceMeters >= 20000 ? 'half_marathon' : workout.distanceMeters >= 9000 ? '10k' : '5k',
      distanceMeters: workout.distanceMeters,
      timeSeconds: workout.durationSeconds,
      formattedTime: workout.durationFormatted,
      vdot: workout.vdot,
      avgHr: workout.avgHR || undefined,
      maxHr: workout.maxHR || undefined,
      avgCadence: workout.avgCadence || undefined,
      elevationGainMeters: workout.elevationGainMeters,
      location: workout.fileName,
      notes: `Calibração fisiológica automática PaceLab via arquivo ${workout.fileName}`
    };
    handleAddTestRecord(newTest);

    // Also register in User Activities via deduplication
    const speedAvgKmh = workout.durationSeconds > 0
      ? Math.round((workout.distanceKm / (workout.durationSeconds / 3600)) * 10) / 10
      : 0;

    const importedAct: UserActivity = {
      id: `import-${Date.now()}`,
      title: workout.fileName.replace(/\.(gpx|tcx|fit)$/i, ''),
      type: (workout as any).activityType || 'run',
      source: 'gpx_import',
      sourceLabel: 'Importação GPS / Telemetria',
      date: workout.date || new Date().toISOString(),
      distanceKm: workout.distanceKm,
      distanceMeters: workout.distanceMeters,
      durationSeconds: workout.durationSeconds,
      durationFormatted: workout.durationFormatted,
      paceSecondsPerKm: workout.paceSecondsPerKm,
      paceFormatted: workout.paceFormatted,
      speedAvgKmh: speedAvgKmh,
      speedMaxKmh: Math.round(speedAvgKmh * 1.15 * 10) / 10,
      avgHr: workout.avgHR || undefined,
      maxHr: workout.maxHR || undefined,
      calories: (workout as any).calories || Math.round(workout.distanceKm * 68),
      elevationGainMeters: workout.elevationGainMeters,
      cadenceSpm: workout.avgCadence || undefined,
      vdot: workout.vdot,
      splits: workout.splits,
      cardiacDriftPct: workout.cardiacDriftPct,
      notes: `Arquivo ${workout.fileName} processado com telemetria completa.`,
      route: (workout as any).routePoints || (workout as any).route || []
    };
    const dedupeRes = deduplicateOrMergeActivity(activities, importedAct);
    handleUpdateActivities(dedupeRes.updatedList);

    // Normalize target goal for plan generation
    const validGoal = (['5k', '10k', '21k', '42k', 'base'].includes(runnerState.targetRaceDistance as any)
      ? runnerState.targetRaceDistance
      : '10k') as '5k' | '10k' | '21k' | '42k' | 'base';

    // Regenerate 8-week training plan for new VDOT
    const newPlan = generateEightWeekPlan(
      runnerState.name,
      newVdot,
      validGoal,
      (runnerState.trainingDays || 4) as 3 | 4 | 5 | 6
    );
    handleUpdatePlan(newPlan);

    // Open Physiological Diagnosis Modal
    setDiagnosedWorkout(workout);
    setIsDiagnosisModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col lg:flex-row telemetry-grid selection:bg-[#FF4E00] selection:text-white">
      {/* Left Sidebar Menu */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        runnerState={runnerState}
        onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
        onOpenPaceModal={() => setIsPaceModalOpen(true)}
        onOpenMetronomeModal={() => setIsMetronomeModalOpen(true)}
        onOpenWristbandModal={() => setIsWristbandModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport (Right of Left Sidebar) */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          runnerState={runnerState}
          onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
          onOpenPaceModal={() => setIsPaceModalOpen(true)}
          onOpenMetronomeModal={() => setIsMetronomeModalOpen(true)}
          onOpenWristbandModal={() => setIsWristbandModalOpen(true)}
          onOpenResetModal={() => setIsResetModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'atividades' && (
            <motion.div
              key="tab-atividades"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ActivitiesTab
                runnerState={runnerState}
                activities={activities}
                onUpdateActivities={handleUpdateActivities}
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'zonas' && (
            <motion.div
              key="tab-zonas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <VdotCalculatorTab
                runnerState={runnerState}
                onUpdateRunnerState={handleUpdateRunnerState}
                onAddTestRecord={handleAddTestRecord}
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'previsoes' && (
            <motion.div
              key="tab-previsoes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RacePredictionsTab
                runnerState={runnerState}
                onUpdateRunnerState={handleUpdateRunnerState}
                onOpenWristbandModal={() => setIsWristbandModalOpen(true)}
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'planilha' && (
            <motion.div
              key="tab-planilha"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TrainingPlanTab
                runnerState={runnerState}
                currentPlan={plan}
                onUpdatePlan={handleUpdatePlan}
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
                onUpdateRunnerState={handleUpdateRunnerState}
                onApplyWorkout={handleApplyWorkout}
                activities={activities}
                onUpdateActivities={handleUpdateActivities}
              />

            </motion.div>
          )}

          {activeTab === 'corridas' && (
            <motion.div
              key="tab-corridas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RacesTab
                runnerState={runnerState}
                onSelectTargetRace={(dist) => {
                  handleUpdateRunnerState({ targetRaceDistance: dist });
                  setActiveTab('previsoes');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'importer' && (
            <motion.div
              key="tab-importer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <WorkoutImporter
                runnerState={runnerState}
                onApplyWorkout={handleApplyWorkout}
                onApplyVdot={(newVdot, source) => {
                  handleUpdateRunnerState({ currentVdot: newVdot, isCalibrated: true, calibrationSource: source });
                  setActiveTab('zonas');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'recuperacao' && (
            <motion.div
              key="tab-recuperacao"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AthleteRecoveryTab
                runnerState={runnerState}
                onUpdateRunnerState={handleUpdateRunnerState}
                recoveryLogs={recoveryLogs}
                onAddRecoveryLog={handleAddRecoveryLog}
                testHistory={testHistory}
                onAddTestRecord={handleAddTestRecord}
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="tab-guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GuideTab
                onOpenAthleteModal={() => setIsAthleteModalOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AthleteModal
        isOpen={isAthleteModalOpen}
        onClose={() => setIsAthleteModalOpen(false)}
        runnerState={runnerState}
        plan={plan}
        activities={activities}
        onSave={handleUpdateRunnerState}
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetAll}
      />

      {diagnosedWorkout && (
        <PhysiologicalDiagnosisModal
          isOpen={isDiagnosisModalOpen}
          onClose={() => setIsDiagnosisModalOpen(false)}
          workout={diagnosedWorkout}
          runnerState={runnerState}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      <QuickPaceConverterModal
        isOpen={isPaceModalOpen}
        onClose={() => setIsPaceModalOpen(false)}
      />

      <CadenceMetronomeModal
        isOpen={isMetronomeModalOpen}
        onClose={() => setIsMetronomeModalOpen(false)}
        defaultSpm={runnerState.cadenceSpm || 180}
      />

      <WristbandModal
        isOpen={isWristbandModalOpen}
        onClose={() => setIsWristbandModalOpen(false)}
        vdot={runnerState.currentVdot}
      />

      {/* Floating AI Coach Gemini Assistant */}
      <CoachChat runnerState={runnerState} activities={activities} />

      {/* Telemetry Footer */}
      <footer className="border-t border-white/10 bg-[#0A0A0A] mt-12 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF4E00]" />
            <span className="text-white font-bold font-heading tracking-wider">PACELAB VDOT v3.5</span>
            <span className="text-slate-400">— Sistema Profissional de Prescrição Jack Daniels & Karvonen</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono-data text-slate-400">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> Karvonen HRR</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-[#FF4E00]" /> Jack Daniels VDOT</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> ACWR Recovery</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}

