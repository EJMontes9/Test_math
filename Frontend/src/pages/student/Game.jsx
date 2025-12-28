import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Zap,
  Target,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle,
  XCircle,
  Flame,
  Award,
  Home,
  Swords
} from 'lucide-react';
import studentService from '../../services/studentService';
import Confetti from 'react-confetti';

// Frases motivacionales para respuestas correctas
const correctPhrases = [
  "¡Brillante! Eres un genio de las matemáticas",
  "¡Espectacular! Sigue así, campeón",
  "¡Increíble! Tu cerebro está en llamas",
  "¡Fantástico! Cada vez eres mejor",
  "¡Wow! Eso fue impresionante",
  "¡Excelente trabajo! Eres imparable",
  "¡Genial! Las matemáticas son tu superpoder",
  "¡Asombroso! Nadie te detiene",
  "¡Perfecto! Estás dominando esto",
  "¡Maravilloso! Tu esfuerzo vale la pena",
  "¡Súper! Eres una estrella matemática",
  "¡Fenomenal! Sigue brillando",
  "¡Extraordinario! Tu mente es poderosa",
  "¡Magnífico! El éxito es tuyo",
  "¡Sensacional! Cada respuesta te hace más fuerte",
  "¡Sobresaliente! Tu dedicación se nota",
  "¡Fabuloso! Las matemáticas te aman",
  "¡Impecable! Eres un crack",
  "¡Tremendo! No hay quien te pare",
  "¡Eres un máquina! Sigue adelante"
];

// Frases motivacionales para respuestas incorrectas
const incorrectPhrases = [
  "¡No te rindas! El próximo será tuyo",
  "¡Tranquilo! De los errores se aprende",
  "¡Ánimo! Cada intento te hace más fuerte",
  "¡Sigue intentando! La práctica hace al maestro",
  "¡No pasa nada! Tú puedes con esto",
  "¡Vamos! El siguiente ejercicio es tu oportunidad",
  "¡Arriba ese ánimo! Confío en ti",
  "¡A seguir! Los campeones nunca se rinden",
  "¡Fuerza! Estás más cerca de entenderlo",
  "¡Adelante! Un tropiezo no es una caída",
  "¡Respira y continúa! Tú eres capaz",
  "¡No te desanimes! Roma no se construyó en un día",
  "¡Persiste! El éxito está a la vuelta de la esquina",
  "¡Mantén la calma! Lo vas a lograr",
  "¡Eso es parte del aprendizaje! Sigue adelante",
  "¡Piensa positivo! El próximo será correcto",
  "¡No bajes los brazos! Eres más fuerte que esto",
  "¡Confía en ti! Puedes hacerlo mejor",
  "¡Es solo un obstáculo! Tú lo superarás",
  "¡Levántate y brilla! El siguiente es tuyo"
];

// Función para obtener frase aleatoria
const getRandomPhrase = (isCorrect) => {
  const phrases = isCorrect ? correctPhrases : incorrectPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
};

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('challenge');

  const [gameState, setGameState] = useState('menu'); // menu, playing, result, gameOver
  const [sessionId, setSessionId] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [motivationalPhrase, setMotivationalPhrase] = useState('');
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Estado para modo Versus
  const [versusMode, setVersusMode] = useState(false);
  const [versusData, setVersusData] = useState(null);
  const versusInitialized = useRef(false);

  // Detectar si estamos en modo Versus y cargar automáticamente
  useEffect(() => {
    if (challengeId && !versusInitialized.current) {
      versusInitialized.current = true;
      setVersusMode(true);
      // Iniciar el juego versus directamente
      const initVersus = async () => {
        try {
          setLoading(true);
          setScore(0);
          setStreak(0);
          setExercisesCompleted(0);
          setCorrectAnswers(0);
          setWrongAnswers(0);
          setGameState('playing');

          // Cargar primer ejercicio
          setSelectedAnswer(null);
          setTimeLeft(60);
          startTimeRef.current = Date.now();

          const response = await studentService.getChallengeExercise(challengeId);

          if (response.success) {
            if (response.data.finished) {
              setScore(response.data.score || 0);
              setCorrectAnswers(response.data.correct_answers || 0);
              setWrongAnswers(response.data.wrong_answers || 0);
              setGameState('gameOver');
              return;
            }

            setCurrentExercise(response.data);
            setScore(response.data.current_score || 0);
            setVersusData({
              currentExercise: response.data.current_exercise,
              totalExercises: response.data.total_exercises
            });
          }
        } catch (error) {
          console.error('Error al iniciar versus:', error);
          navigate('/student/challenges');
        } finally {
          setLoading(false);
        }
      };
      initVersus();
    }
  }, [challengeId, navigate]);

  // Bloquear copiar, pegar, cortar y menú contextual durante el juego
  const preventCopyPaste = useCallback((e) => {
    if (gameState === 'playing' || gameState === 'result') {
      e.preventDefault();
      return false;
    }
  }, [gameState]);

  useEffect(() => {
    // Solo bloquear cuando está en juego
    if (gameState === 'playing' || gameState === 'result') {
      document.addEventListener('copy', preventCopyPaste);
      document.addEventListener('paste', preventCopyPaste);
      document.addEventListener('cut', preventCopyPaste);
      document.addEventListener('contextmenu', preventCopyPaste);

      // Bloquear atajos de teclado
      const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
          e.preventDefault();
          return false;
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('copy', preventCopyPaste);
        document.removeEventListener('paste', preventCopyPaste);
        document.removeEventListener('cut', preventCopyPaste);
        document.removeEventListener('contextmenu', preventCopyPaste);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [gameState, preventCopyPaste]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timerRef.current);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleTimeout();
    }
  }, [gameState, timeLeft]);

  // Cargar siguiente ejercicio de Versus
  const loadVersusExercise = async () => {
    try {
      setLoading(true);
      setSelectedAnswer(null);
      setTimeLeft(60);
      startTimeRef.current = Date.now();

      const response = await studentService.getChallengeExercise(challengeId);

      if (response.success) {
        // Verificar si ya terminó los ejercicios del versus
        if (response.data.finished) {
          setScore(response.data.score || 0);
          setCorrectAnswers(response.data.correct_answers || 0);
          setWrongAnswers(response.data.wrong_answers || 0);
          setGameState('gameOver');
          return;
        }

        setCurrentExercise(response.data);
        setScore(response.data.current_score || 0);
        setVersusData({
          currentExercise: response.data.current_exercise,
          totalExercises: response.data.total_exercises
        });
      }
    } catch (error) {
      console.error('Error al cargar ejercicio versus:', error);
      // Si hay error (ej: ya terminó), volver a challenges
      navigate('/student/challenges');
    } finally {
      setLoading(false);
    }
  };

  // Enviar respuesta en modo Versus
  const submitVersusAnswer = async () => {
    if (!selectedAnswer || gameState === 'result' || loading) return;

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      setLoading(true);
      const response = await studentService.submitChallengeAnswer(
        challengeId,
        currentExercise.exercise_id,
        selectedAnswer,
        timeTaken
      );

      if (response.success) {
        setLastResult(response.data);
        setScore(response.data.new_score);
        setExercisesCompleted(response.data.exercises_completed);
        setVersusData(prev => ({
          ...prev,
          paralelo1Score: response.data.paralelo1Score,
          paralelo2Score: response.data.paralelo2Score,
          hasFinished: response.data.has_finished,
          currentExercise: response.data.exercises_completed,
          totalExercises: response.data.total_exercises
        }));

        // Generar frase motivacional aleatoria
        setMotivationalPhrase(getRandomPhrase(response.data.is_correct));

        if (response.data.is_correct) {
          setCorrectAnswers((prev) => prev + 1);
          setStreak((prev) => prev + 1);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);

          if ((streak + 1) % 5 === 0) {
            playStreakAnimation();
          }
        } else {
          setWrongAnswers((prev) => prev + 1);
          setStreak(0);
        }

        // Verificar si terminó el versus
        if (response.data.has_finished) {
          setGameState('gameOver');
        } else {
          setGameState('result');
        }
      }
    } catch (error) {
      console.error('Error al enviar respuesta versus:', error);
      alert('Error al enviar respuesta: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    try {
      setLoading(true);
      const response = await studentService.startGame();

      if (response.success) {
        setSessionId(response.data.session_id);
        setScore(0);
        setStreak(0);
        setExercisesCompleted(0);
        setCorrectAnswers(0);
        setWrongAnswers(0);
        setGameState('playing');
        await loadNextExercise(response.data.session_id);
      }
    } catch (error) {
      console.error('Error al iniciar juego:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextExercise = async (session) => {
    try {
      setLoading(true);
      setSelectedAnswer(null);
      setTimeLeft(60);
      startTimeRef.current = Date.now();

      const response = await studentService.getNextExercise(session || sessionId);

      if (response.success) {
        setCurrentExercise(response.data);
        setScore(response.data.current_score || score);
      }
    } catch (error) {
      console.error('Error al cargar ejercicio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    if (gameState === 'result') return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || gameState === 'result') return;

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      setLoading(true);
      const response = await studentService.submitAnswer(
        sessionId,
        currentExercise.exercise_id,
        selectedAnswer,
        timeTaken
      );

      if (response.success) {
        setLastResult(response.data);
        setScore(response.data.new_score);
        setExercisesCompleted((prev) => prev + 1);

        // Generar frase motivacional aleatoria
        setMotivationalPhrase(getRandomPhrase(response.data.is_correct));

        if (response.data.is_correct) {
          setCorrectAnswers((prev) => prev + 1);
          setStreak((prev) => prev + 1);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);

          // Gran celebración cada 5 aciertos seguidos
          if ((streak + 1) % 5 === 0) {
            playStreakAnimation();
          }
        } else {
          setWrongAnswers((prev) => prev + 1);
          setStreak(0);
        }

        setGameState('result');
      }
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    // Auto-enviar respuesta incorrecta si se acaba el tiempo
    if (gameState === 'playing' && currentExercise) {
      if (versusMode) {
        submitVersusAnswer();
      } else {
        submitAnswer();
      }
    }
  };

  const nextExercise = () => {
    setGameState('playing');
    if (versusMode) {
      loadVersusExercise();
    } else {
      loadNextExercise();
    }
  };

  const endGame = async () => {
    try {
      const response = await studentService.endGame(sessionId);

      if (response.success) {
        setLastResult(response.data);
        setGameState('gameOver');
      }
    } catch (error) {
      console.error('Error al finalizar juego:', error);
    }
  };

  const playStreakAnimation = () => {
    // Trigger special animation for streak
    const audio = new Audio('/sounds/success.mp3');
    audio.play().catch(() => {});
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'from-green-500 to-green-600';
      case 'medium':
        return 'from-yellow-500 to-yellow-600';
      case 'hard':
        return 'from-red-500 to-red-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Medio';
      case 'hard':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 overflow-hidden">
        {/* Botón flotante para volver */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/student/dashboard')}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver</span>
        </motion.button>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <Trophy className="w-24 h-24 text-yellow-500" />
            </motion.div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              ¡Desafío Matemático!
            </h1>
            <p className="text-xl text-gray-600">
              Pon a prueba tus habilidades y gana puntos
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center"
            >
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Ejercicios</p>
              <p className="text-2xl font-bold text-blue-600">Adaptativos</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center"
            >
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Sistema de</p>
              <p className="text-2xl font-bold text-purple-600">Puntos</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center"
            >
              <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Rachas de</p>
              <p className="text-2xl font-bold text-orange-600">Victoria</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center"
            >
              <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Logros y</p>
              <p className="text-2xl font-bold text-yellow-600">Premios</p>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Cargando...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" />
                ¡Comenzar Juego!
                <ArrowRight className="w-6 h-6" />
              </span>
            )}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'playing' || gameState === 'result') {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 overflow-y-auto select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
        onCopy={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

        {/* Botón flotante para salir */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(versusMode ? '/student/challenges' : '/student/dashboard')}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver</span>
        </motion.button>

        {/* Header con puntuación */}
        <div className="max-w-4xl mx-auto mb-6">
          {/* Indicador de Versus */}
          {versusMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl px-4 py-2 flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              <span className="font-bold">Modo Versus</span>
              {versusData && (
                <span className="text-sm opacity-90">
                  - Ejercicio {versusData.currentExercise || 1} de {versusData.totalExercises || '∞'}
                </span>
              )}
            </motion.div>
          )}
          <div className={`bg-white shadow-lg p-4 ${versusMode ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
            <div className="grid grid-cols-3 gap-4">
              {/* Score */}
              <motion.div
                key={score}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-600">Puntos</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{score}</p>
              </motion.div>

              {/* Streak */}
              <motion.div
                key={streak}
                initial={{ scale: streak > 0 ? 1.2 : 1 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-600">Racha</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{streak}</p>
              </motion.div>

              {/* Timer */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-600">Tiempo</span>
                </div>
                <p
                  className={`text-3xl font-bold ${
                    timeLeft < 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'
                  }`}
                >
                  {timeLeft}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ejercicio */}
        <AnimatePresence mode="wait">
          {currentExercise && (
            <motion.div
              key={currentExercise.exercise_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                {/* Difficulty Badge */}
                <div className="flex items-center justify-between mb-6">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`px-4 py-2 bg-gradient-to-r ${getDifficultyColor(
                      currentExercise.difficulty
                    )} text-white rounded-full font-semibold inline-block`}
                  >
                    {getDifficultyText(currentExercise.difficulty)}
                  </motion.div>

                  <div className="text-sm text-gray-500">
                    Ejercicio #{exercisesCompleted + 1}
                  </div>
                </div>

                {/* Question */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 text-center">
                    {currentExercise.question}
                  </h2>
                  <div className="text-center text-gray-600">
                    <Star className="w-5 h-5 inline mr-2 text-yellow-500" />
                    +{currentExercise.possible_points} si aciertas
                  </div>
                </motion.div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {currentExercise.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = lastResult?.correct_answer === option;
                    const isWrong =
                      gameState === 'result' && isSelected && !lastResult?.is_correct;

                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={gameState === 'playing' ? { scale: 1.03 } : {}}
                        whileTap={gameState === 'playing' ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswerSelect(option)}
                        disabled={gameState === 'result' || loading}
                        className={`p-6 rounded-2xl text-xl font-bold transition-all ${
                          gameState === 'result'
                            ? isCorrect
                              ? 'bg-green-500 text-white ring-4 ring-green-300'
                              : isWrong
                              ? 'bg-red-500 text-white ring-4 ring-red-300'
                              : 'bg-gray-100 text-gray-400'
                            : isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {gameState === 'result' && isCorrect && (
                            <CheckCircle className="w-6 h-6" />
                          )}
                          {gameState === 'result' && isWrong && (
                            <XCircle className="w-6 h-6" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Result Message */}
                <AnimatePresence>
                  {gameState === 'result' && lastResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`mb-6 p-6 rounded-2xl ${
                        lastResult.is_correct
                          ? 'bg-green-50 border-2 border-green-300'
                          : 'bg-red-50 border-2 border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {lastResult.is_correct ? (
                          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3
                            className={`text-2xl font-bold mb-2 ${
                              lastResult.is_correct ? 'text-green-800' : 'text-red-800'
                            }`}
                          >
                            {lastResult.is_correct
                              ? `¡Correcto! ${streak >= 3 ? '🔥' : '🎉'}`
                              : 'Incorrecto 💪'}
                          </h3>
                          {/* Frase motivacional */}
                          <p
                            className={`text-lg font-medium mb-2 ${
                              lastResult.is_correct ? 'text-green-700' : 'text-orange-600'
                            }`}
                          >
                            {motivationalPhrase}
                          </p>
                          <p
                            className={`text-sm ${
                              lastResult.is_correct ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {lastResult.explanation}
                          </p>
                          {lastResult.is_correct ? (
                            <p className="text-green-600 font-semibold mt-2">
                              +{lastResult.points_earned} puntos
                            </p>
                          ) : (
                            <p className="text-red-600 font-semibold mt-2">
                              -{lastResult.points_lost} puntos
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {gameState === 'playing' ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={versusMode ? submitVersusAnswer : submitAnswer}
                        disabled={!selectedAnswer || loading}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Enviar Respuesta
                      </motion.button>
                      {!versusMode && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={endGame}
                          className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl"
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={nextExercise}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      Siguiente Ejercicio
                      <ArrowRight className="w-6 h-6" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 overflow-hidden">
        <Confetti recycle={false} numberOfPieces={1000} />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{ duration: 2 }}
            className="text-center mb-8"
          >
            {versusMode ? (
              <>
                <Swords className="w-32 h-32 text-indigo-500 mx-auto mb-4" />
                <h1 className="text-5xl font-bold text-gray-800 mb-4">
                  ¡Versus Completado!
                </h1>
                <p className="text-xl text-gray-600">
                  Has aportado {score} puntos a tu paralelo
                </p>
              </>
            ) : (
              <>
                <Trophy className="w-32 h-32 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-5xl font-bold text-gray-800 mb-4">
                  ¡Juego Terminado!
                </h1>
              </>
            )}
          </motion.div>

          {/* Estadísticas finales */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Puntuación Final</p>
              <p className="text-4xl font-bold text-yellow-600">{score}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Ejercicios</p>
              <p className="text-4xl font-bold text-blue-600">{exercisesCompleted}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Correctas</p>
              <p className="text-4xl font-bold text-green-600">{correctAnswers}</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Incorrectas</p>
              <p className="text-4xl font-bold text-red-600">{wrongAnswers}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {versusMode ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/student/challenges')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-6 h-6" />
                Volver a Versus
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setGameState('menu');
                    setSessionId(null);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trophy className="w-6 h-6" />
                  Jugar de Nuevo
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/student/dashboard')}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-xl font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-6 h-6" />
                  Volver al Menú Principal
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
