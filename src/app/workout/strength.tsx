import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator, Alert, Platform, Pressable, ScrollView,
    StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppCard from '../../components/AppCard';
import ExercisePersonalRecord from '../../components/ExercisePersonalRecord';
import PreviousExercisePerformance from '../../components/PreviousExercisePerformance';
import { exerciseLibrary, type ExerciseLibraryItem } from '../../constants/exercises';
import { borderRadius, colors, fontSize, spacing } from '../../constants/theme';
import { useWorkout, type WorkoutSet } from '../../context/WorkoutContext';

function elapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function numberValue(value: string) {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

type RowProps = {
  set: WorkoutSet;
  deleting: boolean;
  save: (id:string,w:number|null,r:number|null,c:boolean)=>Promise<void>;
  toggle: (id:string,w:number|null,r:number|null,c:boolean)=>Promise<void>;
  remove: (id:string,n:number)=>void;
};

function SetRow({ set, deleting, save, toggle, remove }: RowProps) {
  const [weight, setWeight] = useState(set.weight === null ? '' : String(set.weight));
  const [reps, setReps] = useState(set.reps === null ? '' : String(set.reps));
  const [saving, setSaving] = useState(false);

  useEffect(() => setWeight(set.weight === null ? '' : String(set.weight)), [set.weight]);
  useEffect(() => setReps(set.reps === null ? '' : String(set.reps)), [set.reps]);

  async function saveValues() {
    const w = numberValue(weight), r = numberValue(reps);
    if (w === set.weight && r === set.reps) return;
    setSaving(true);
    await save(set.id, w, r, set.completed);
    setSaving(false);
  }

  async function toggleDone() {
    setSaving(true);
    await toggle(set.id, numberValue(weight), numberValue(reps), set.completed);
    setSaving(false);
  }

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>
      <TextInput style={styles.setInput} value={weight} onChangeText={setWeight}
        onBlur={saveValues} keyboardType="decimal-pad" placeholder="0"
        placeholderTextColor={colors.textSecondary} editable={!saving} />
      <TextInput style={styles.setInput} value={reps} onChangeText={setReps}
        onBlur={saveValues} keyboardType="number-pad" placeholder="0"
        placeholderTextColor={colors.textSecondary} editable={!saving} />
      <Pressable style={[styles.doneButton, set.completed && styles.doneButtonActive]}
        onPress={toggleDone} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color={set.completed ? colors.background : colors.primary} /> :
          <Text style={[styles.doneText, set.completed && styles.doneTextActive]}>{set.completed ? '✓' : '○'}</Text>}
      </Pressable>
      <Pressable style={styles.deleteSet} onPress={() => remove(set.id,set.setNumber)}
        disabled={deleting || saving}>
        {deleting ? <ActivityIndicator size="small" color={colors.danger}/> :
          <Text style={styles.deleteSetText}>×</Text>}
      </Pressable>
    </View>
  );
}

export default function StrengthWorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeWorkout, loading, loadActiveWorkout, addExercise, deleteExercise,
    addSet, updateSet, deleteSet, finishWorkout, discardActiveWorkout,
    clearActiveWorkout,
  } = useWorkout();

  const [seconds,setSeconds] = useState(0);
  const [picker,setPicker] = useState(false);
  const [search,setSearch] = useState('');
  const [selected,setSelected] = useState<ExerciseLibraryItem|null>(null);
  const [custom,setCustom] = useState(false);
  const [customName,setCustomName] = useState('');
  const [adding,setAdding] = useState(false);
  const [finishing,setFinishing] = useState(false);
  const [discarding,setDiscarding] = useState(false);
  const [deletingExercise,setDeletingExercise] = useState<string|null>(null);
  const [deletingSet,setDeletingSet] = useState<string|null>(null);

  useEffect(() => { if (!activeWorkout) loadActiveWorkout(); }, []);

  useEffect(() => {
    if (!activeWorkout?.startedAt || activeWorkout.completedAt) return;
    const tick = () => {
      const start = new Date(activeWorkout.startedAt).getTime();
      setSeconds(Number.isFinite(start) ? Math.max(0,Math.floor((Date.now()-start)/1000)) : 0);
    };
    tick();
    const id = setInterval(tick,1000);
    return () => clearInterval(id);
  }, [activeWorkout?.startedAt, activeWorkout?.completedAt]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return exerciseLibrary.filter(x => `${x.name} ${x.category}`.toLowerCase().includes(q)).slice(0,12);
  }, [search]);

  const totalSets = activeWorkout?.exercises.reduce((n,e)=>n+e.sets.length,0) ?? 0;
  const completedSets = activeWorkout?.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0) ?? 0;
  const progress = totalSets ? Math.min(completedSets/totalSets*100,100) : 0;

  function message(title:string, body:string) {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${body}`);
    else Alert.alert(title,body);
  }

  async function addChosenExercise() {
    const name = custom ? customName.trim() : selected?.name ?? '';
    if (!name) { message('Exercise required','Select an exercise or enter a custom exercise name.'); return; }
    setAdding(true);
    const ok = await addExercise(name);
    setAdding(false);
    if (!ok) { message('Unable to add exercise','Apollo could not add this exercise.'); return; }
    setPicker(false); setSearch(''); setSelected(null); setCustom(false); setCustomName('');
  }

  async function removeExercise(id:string) {
    setDeletingExercise(id);
    const ok = await deleteExercise(id);
    setDeletingExercise(null);
    if (!ok) message('Unable to remove exercise','Apollo could not remove this exercise.');
  }

  function confirmExercise(id:string,name:string) {
    const body = `Remove ${name}? All sets inside it will also be deleted.`;
    if (Platform.OS === 'web') { if (window.confirm(body)) removeExercise(id); return; }
    Alert.alert('Remove Exercise',body,[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>removeExercise(id)}]);
  }

  async function removeSet(id:string) {
    setDeletingSet(id); const ok = await deleteSet(id); setDeletingSet(null);
    if (!ok) message('Unable to remove set','Apollo could not remove this set.');
  }

  function confirmSet(id:string,n:number) {
    const body=`Delete set ${n}?`;
    if (Platform.OS === 'web') { if(window.confirm(body)) removeSet(id); return; }
    Alert.alert('Delete Set',body,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>removeSet(id)}]);
  }

  async function complete() {
    setFinishing(true); const ok=await finishWorkout(); setFinishing(false);
    if(!ok){message('Unable to finish workout','Apollo could not save this workout as complete.');return;}
    clearActiveWorkout(); router.back();
  }

  function confirmFinish() {
    const body=completedSets<totalSets?`You completed ${completedSets} of ${totalSets} sets. Finish anyway?`:'Finish and save this workout?';
    if(Platform.OS==='web'){if(window.confirm(body)) complete();return;}
    Alert.alert('Finish Workout',body,[{text:'Cancel',style:'cancel'},{text:'Finish',onPress:complete}]);
  }

  async function discard() {
    setDiscarding(true); const ok=await discardActiveWorkout(); setDiscarding(false);
    if(!ok){message('Unable to discard workout','Apollo could not discard this workout.');return;}
    router.back();
  }

  function confirmDiscard() {
    const body='Discard this workout? Its exercises and sets will be deleted.';
    if(Platform.OS==='web'){if(window.confirm(body)) discard();return;}
    Alert.alert('Discard Workout',body,[{text:'Cancel',style:'cancel'},{text:'Discard',style:'destructive',onPress:discard}]);
  }

  if (loading && !activeWorkout) return (
    <View style={styles.center}><ActivityIndicator color={colors.primary}/><Text style={styles.muted}>Loading workout...</Text></View>
  );

  if (!activeWorkout) return (
    <View style={[styles.screen,{paddingTop:insets.top+spacing.lg,paddingHorizontal:spacing.lg}]}>
      <View style={styles.topBar}>
        <Pressable style={styles.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={24} color={colors.text}/></Pressable>
        <View style={styles.topTitle}><Text style={styles.eyebrow}>APOLLO ULTRA</Text><Text style={styles.title}>Workout</Text></View>
        <View style={styles.spacer}/>
      </View>
      <AppCard><Text style={styles.exerciseName}>No active workout</Text><Text style={styles.muted}>Start a workout from the Workout tab.</Text></AppCard>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content,{paddingTop:insets.top+spacing.md,paddingBottom:Math.max(insets.bottom,10)+spacing.xxl}]}>
        <View style={styles.topBar}>
          <Pressable style={styles.back} onPress={()=>router.back()}><Ionicons name="chevron-back" size={24} color={colors.text}/></Pressable>
          <View style={styles.topTitle}><Text style={styles.eyebrow}>APOLLO ULTRA</Text><Text style={styles.title}>{activeWorkout.name}</Text></View>
          <View style={styles.spacer}/>
        </View>

        <View style={styles.status}><View style={styles.dot}/><Text style={styles.statusText}>ACTIVE WORKOUT</Text></View>

        <View style={styles.session}>
          <View><Text style={styles.smallLabel}>ELAPSED TIME</Text><Text style={styles.time}>{elapsed(seconds)}</Text></View>
          <View style={styles.right}><Text style={styles.progressValue}>{completedSets}/{totalSets}</Text><Text style={styles.smallLabel}>SETS COMPLETE</Text></View>
        </View>
        <View style={styles.track}><View style={[styles.fill,{width:`${progress}%`}]} /></View>

        {activeWorkout.exercises.length===0 ? (
          <AppCard><Text style={styles.exerciseName}>Ready for your first exercise</Text><Text style={styles.muted}>Add an exercise to begin tracking weight, reps, previous performance, and PRs.</Text></AppCard>
        ) : activeWorkout.exercises.map((exercise,index)=>(
          <AppCard key={exercise.id}>
            <View style={styles.exerciseHeader}>
              <View style={styles.number}><Text style={styles.numberText}>{index+1}</Text></View>
              <View style={styles.flex}><Text style={styles.exerciseName}>{exercise.exerciseName}</Text><Text style={styles.muted}>{exercise.sets.filter(s=>s.completed).length}/{exercise.sets.length} sets complete</Text></View>
              <Pressable style={styles.iconButton} onPress={()=>confirmExercise(exercise.id,exercise.exerciseName)} disabled={deletingExercise===exercise.id}>
                {deletingExercise===exercise.id?<ActivityIndicator size="small" color={colors.danger}/>:<Ionicons name="trash-outline" size={19} color={colors.danger}/>}
              </Pressable>
            </View>
            <PreviousExercisePerformance exerciseName={exercise.exerciseName}/>
            <ExercisePersonalRecord exerciseName={exercise.exerciseName} currentSets={exercise.sets}/>
            {exercise.sets.length>0 && (
              <View style={styles.table}>
                <View style={styles.headers}><Text style={styles.hSet}>SET</Text><Text style={styles.hInput}>WEIGHT</Text><Text style={styles.hInput}>REPS</Text><Text style={styles.hDone}>DONE</Text><View style={styles.hDelete}/></View>
                {exercise.sets.map(set=><SetRow key={set.id} set={set} deleting={deletingSet===set.id}
                  save={async(id,w,r,c)=>{await updateSet(id,w,r,c)}} toggle={async(id,w,r,c)=>{await updateSet(id,w,r,!c)}} remove={confirmSet}/>)}
              </View>
            )}
            <Pressable style={styles.outline} onPress={async()=>{if(!await addSet(exercise.id)) message('Unable to add set','Apollo could not add this set.')}}><Text style={styles.outlineText}>+ ADD SET</Text></Pressable>
          </AppCard>
        ))}

        {picker ? (
          <AppCard>
            <View style={styles.exerciseHeader}><View style={styles.flex}><Text style={styles.eyebrow}>ADD EXERCISE</Text><Text style={styles.muted}>Search the library or add a custom movement.</Text></View><Pressable onPress={()=>setPicker(false)}><Ionicons name="close" size={24} color={colors.textSecondary}/></Pressable></View>
            {!custom ? (<>
              <TextInput style={styles.search} value={search} onChangeText={v=>{setSearch(v);setSelected(null)}} placeholder="Search exercises" placeholderTextColor={colors.textSecondary} autoFocus/>
              {search.trim()?<View style={styles.results}>{results.map(x=><Pressable key={`${x.name}-${x.category}`} style={[styles.result,selected?.name===x.name&&styles.selected]} onPress={()=>{setSelected(x);setSearch(x.name)}}><View style={styles.flex}><Text style={styles.resultName}>{x.name}</Text><Text style={styles.muted}>{x.category}</Text></View><Text style={styles.selectText}>{selected?.name===x.name?'SELECTED':'SELECT'}</Text></Pressable>)}</View>:<Text style={styles.muted}>Search by exercise name or muscle group.</Text>}
              <Pressable style={[styles.primary,(!selected||adding)&&styles.disabled]} disabled={!selected||adding} onPress={addChosenExercise}>{adding?<ActivityIndicator color={colors.background}/>:<Text style={styles.primaryText}>ADD EXERCISE</Text>}</Pressable>
              <Pressable style={styles.outline} onPress={()=>{setCustom(true);setSearch('');setSelected(null)}}><Text style={styles.outlineText}>+ CUSTOM EXERCISE</Text></Pressable>
            </>):(<>
              <TextInput style={styles.search} value={customName} onChangeText={setCustomName} placeholder="Custom exercise name" placeholderTextColor={colors.textSecondary} autoFocus/>
              <Pressable style={[styles.primary,(!customName.trim()||adding)&&styles.disabled]} disabled={!customName.trim()||adding} onPress={addChosenExercise}>{adding?<ActivityIndicator color={colors.background}/>:<Text style={styles.primaryText}>ADD CUSTOM EXERCISE</Text>}</Pressable>
              <Pressable style={styles.outline} onPress={()=>{setCustom(false);setCustomName('')}}><Text style={styles.outlineText}>BACK TO LIBRARY</Text></Pressable>
            </>)}
          </AppCard>
        ) : (
          <Pressable style={styles.addExercise} onPress={()=>{setSearch('');setSelected(null);setCustom(false);setCustomName('');setPicker(true)}}><Ionicons name="add" size={22} color={colors.primary}/><Text style={styles.addExerciseText}>ADD EXERCISE</Text></Pressable>
        )}

        <Pressable style={[styles.finish,finishing&&styles.disabled]} onPress={confirmFinish} disabled={finishing||discarding}>{finishing?<ActivityIndicator color={colors.background}/>:<><Ionicons name="checkmark" size={22} color={colors.background}/><Text style={styles.finishText}>FINISH WORKOUT</Text></>}</Pressable>
        <Pressable style={[styles.discard,discarding&&styles.disabled]} onPress={confirmDiscard} disabled={discarding||finishing}>{discarding?<ActivityIndicator color={colors.danger}/>:<Text style={styles.discardText}>DISCARD WORKOUT</Text>}</Pressable>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},center:{flex:1,backgroundColor:colors.background,alignItems:'center',justifyContent:'center',gap:spacing.md},
  content:{paddingHorizontal:spacing.lg,gap:spacing.lg},topBar:{flexDirection:'row',alignItems:'center',minHeight:48},back:{width:44,height:44,borderRadius:22,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  topTitle:{flex:1,alignItems:'center',paddingHorizontal:spacing.sm},spacer:{width:44},eyebrow:{color:colors.primary,fontSize:10,fontWeight:'800',letterSpacing:2},title:{color:colors.text,fontSize:fontSize.subtitle,fontWeight:'700',marginTop:2,textAlign:'center'},
  status:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.primary},statusText:{color:colors.primary,fontSize:fontSize.small,fontWeight:'800',letterSpacing:1.5},
  session:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.xl,padding:spacing.lg},smallLabel:{color:colors.textSecondary,fontSize:10,fontWeight:'800',letterSpacing:1.1},
  time:{color:colors.text,fontSize:38,fontWeight:'800',letterSpacing:-1,marginTop:spacing.xs},right:{alignItems:'flex-end'},progressValue:{color:colors.primary,fontSize:fontSize.title,fontWeight:'800'},track:{height:8,borderRadius:999,overflow:'hidden',backgroundColor:colors.surfaceSecondary},fill:{height:'100%',backgroundColor:colors.primary,borderRadius:999},
  muted:{color:colors.textSecondary,fontSize:fontSize.small,lineHeight:18},exerciseHeader:{flexDirection:'row',alignItems:'center',gap:spacing.md},number:{width:40,height:40,borderRadius:20,backgroundColor:colors.surfaceSecondary,alignItems:'center',justifyContent:'center'},numberText:{color:colors.primary,fontSize:fontSize.body,fontWeight:'700'},flex:{flex:1},exerciseName:{color:colors.text,fontSize:fontSize.subtitle,fontWeight:'700'},iconButton:{width:40,height:40,alignItems:'center',justifyContent:'center'},
  table:{width:'100%',gap:spacing.sm},headers:{flexDirection:'row',alignItems:'center',gap:6},hSet:{width:32,color:colors.textSecondary,fontSize:10,fontWeight:'700',textAlign:'center'},hInput:{flex:1,color:colors.textSecondary,fontSize:10,fontWeight:'700',textAlign:'center'},hDone:{width:42,color:colors.textSecondary,fontSize:10,fontWeight:'700',textAlign:'center'},hDelete:{width:34},
  setRow:{flexDirection:'row',alignItems:'center',gap:6},setNumber:{width:32,color:colors.text,fontSize:fontSize.body,fontWeight:'600',textAlign:'center'},setInput:{flex:1,minWidth:0,height:44,backgroundColor:colors.surfaceSecondary,borderWidth:1,borderColor:colors.border,borderRadius:10,color:colors.text,fontSize:fontSize.body,textAlign:'center',paddingHorizontal:spacing.sm},
  doneButton:{width:42,height:44,borderRadius:10,borderWidth:1,borderColor:colors.primary,alignItems:'center',justifyContent:'center'},doneButtonActive:{backgroundColor:colors.primary},doneText:{color:colors.primary,fontSize:fontSize.body,fontWeight:'800'},doneTextActive:{color:colors.background},deleteSet:{width:34,height:44,alignItems:'center',justifyContent:'center'},deleteSetText:{color:colors.danger,fontSize:24},
  outline:{minHeight:46,borderRadius:23,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},outlineText:{color:colors.primary,fontSize:fontSize.small,fontWeight:'800'},addExercise:{minHeight:58,borderRadius:29,borderWidth:1,borderColor:colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},addExerciseText:{color:colors.primary,fontSize:fontSize.body,fontWeight:'800',letterSpacing:.7},
  search:{minHeight:48,backgroundColor:colors.surfaceSecondary,borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.md,color:colors.text,paddingHorizontal:spacing.md,fontSize:fontSize.body},results:{gap:spacing.sm},result:{minHeight:56,borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.md,padding:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.md},selected:{borderColor:colors.primary},resultName:{color:colors.text,fontSize:fontSize.body,fontWeight:'700'},selectText:{color:colors.primary,fontSize:10,fontWeight:'800'},
  primary:{minHeight:52,borderRadius:26,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},primaryText:{color:colors.background,fontSize:fontSize.body,fontWeight:'900'},finish:{minHeight:60,borderRadius:30,backgroundColor:colors.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},finishText:{color:colors.background,fontSize:fontSize.body,fontWeight:'900'},discard:{minHeight:48,borderRadius:24,borderWidth:1,borderColor:colors.danger,alignItems:'center',justifyContent:'center'},discardText:{color:colors.danger,fontSize:fontSize.small,fontWeight:'800'},disabled:{opacity:.5},
});
