// Survivor Mode — play until your first mistake
const OPTIONS_PER_QUESTION = 5;
const AUTO_ADVANCE_MS = 650;
const DATA_URL = 'data/questions.json?v=' + Date.now();

const EMBEDDED_QUESTIONS = [
  { id: 1, image: "images/BotanischerGarten.png", answer: "Botanischer Garten" },
  { id: 2, image: "images/Hauptgebäude.png", answer: "UZH Hauptgebäude" },
  { id: 3, image: "images/UBErziehungswissenschaften.png", answer: "UB Erziehungswissenschaften" },
  { id: 4, image: "images/Careum.png", answer: "Careum" },
  { id: 5, image: "images/UBBetriebswirtschaftslehre.png", answer: "UB Betriebswirtschaftslehre" },
  { id: 6, image: "images/Forum (2031).png", answer: "Forum (2031)" },
  { id: 7, image: "images/Irchelpark.png", answer: "Irchelpark" },
  { id: 8, image: "images/Asien-Orient Institut.png", answer: "Asien-Orient Institut" },
  { id: 9, image: "images/Rechtswissenschaftliche Bibliothek.png", answer: "Rechtswissenschaftliche Bibliothek" },
  { id: 10, image: "images/Zentrum für Zahnmedizin.png", answer: "Zentrum für Zahnmedizin" },
  { id: 11, image: "images/Alter Botanischer Garten.png", answer: "Alter Botanischer Garten" },
  { id: 12, image: "images/Theologisches Seminar Kirchgasse.png", answer: "Theologisches Seminar Kirchgasse" },
  { id: 13, image: "images/Universitätsspital.png", answer: "Universitätsspital" }
];

let globalData = [];
let remaining = [];
let streak = 0;
let best = parseInt(localStorage.getItem('best-streak') || '0', 10);
let current = null;

const screenStart = document.getElementById('screen-start');
const screenGame = document.getElementById('screen-game');
const screenResult = document.getElementById('screen-result');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const imgEl = document.getElementById('question-image');
const optionsEl = document.getElementById('options');
const streakIndicator = document.getElementById('streak-indicator');
const bestIndicator = document.getElementById('best-indicator');
const bestStart = document.getElementById('best-streak-start');
const roundIndicator = document.getElementById('round-indicator');
const resultSummary = document.getElementById('result-summary');

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function uniqOptions(all, correct, needed){
  const pool = shuffle(all.map(q=>q.answer).filter(a=>a!==correct));
  const set = new Set();
  for(const a of pool){ set.add(a); if(set.size===needed) break; }
  return Array.from(set);
}

async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    const valid = json.filter(q=>q && q.image && q.answer);
    if(valid.length < OPTIONS_PER_QUESTION) throw new Error('Dataset too small');
    return valid.map((q,idx)=>({ id:q.id ?? idx, image:q.image, answer:String(q.answer) }));
  }catch(e){
    console.warn('Using embedded fallback.', e);
    return EMBEDDED_QUESTIONS;
  }
}

function setScreen(target){ [screenStart,screenGame,screenResult].forEach(s=>s.classList.remove('active')); target.classList.add('active'); }

function startGame(){
  streak = 0;
  remaining = shuffle([...globalData]);
  bestStart.textContent = `Best: ${best}`;
  bestIndicator.textContent = `Best: ${best}`;
  streakIndicator.textContent = `Streak: ${streak}`;
  setScreen(screenGame);
  nextQuestion();
}

function nextQuestion(){
  if(remaining.length === 0){
    remaining = shuffle([...globalData]); // loop endlessly
  }
  current = remaining.pop();
  roundIndicator.textContent = `Remaining: ${remaining.length}`;
  renderQuestion(current);
}

function renderQuestion(q){
  imgEl.src = q.image;
  imgEl.alt = `Which UZH location is this?`;
  imgEl.classList.remove('fade'); void imgEl.offsetWidth; imgEl.classList.add('fade');
  optionsEl.innerHTML = '';

  const wrong = uniqOptions(globalData, q.answer, OPTIONS_PER_QUESTION-1);
  const options = shuffle([q.answer, ...wrong]);
  for(const label of options){
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', ()=> handleAnswer(btn, label===q.answer));
    li.appendChild(btn);
    optionsEl.appendChild(li);
  }
}

function handleAnswer(btn, correct){
  [...document.querySelectorAll('.option-btn')].forEach(b=>b.disabled=true);
  if(correct){
    btn.classList.add('correct');
    streak++;
    streakIndicator.textContent = `Streak: ${streak}`;
    if(streak > best){ best = streak; bestIndicator.textContent = `Best: ${best}`; localStorage.setItem('best-streak', String(best)); }
    setTimeout(nextQuestion, AUTO_ADVANCE_MS);
  }else{
    btn.classList.add('wrong');
    const correctBtn = [...document.querySelectorAll('.option-btn')].find(b=>b.textContent===current.answer);
    if(correctBtn) correctBtn.classList.add('correct');
    setTimeout(finish, 700);
  }
}

function finish(){
  resultSummary.textContent = `Your streak: ${streak}. Best: ${best}.`;
  setScreen(screenResult);
}

btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', ()=> setScreen(screenStart));

loadData().then(data=>{
  globalData = data;
  bestStart.textContent = `Best: ${best}`;
}).catch(e=>{
  console.error(e);
  alert('Failed to load data.');
});
