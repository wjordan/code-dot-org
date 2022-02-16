var studentVarToken = false;
var varLog=buildVariableLog();
var previousVarLog;// = JSON.parse(JSON.stringify(varLog));


function buildVariableLog(){
  var varLog={};
  var start =
    (Object.keys(window).indexOf("studentVarToken")) + 1;
  var end = Object.keys(window).length;
  var index;
  for(var i=start;i<end;i++){
    if (typeof window[Object.keys(window)[i]] == "number" || typeof window[Object.keys(window)[i]] == "string"|| typeof window[Object.keys(window)[i]] == "boolean") {
      varLog[Object.keys(window)[i]] = window[Object.keys(window)[i]];
    }
  }
  return varLog;
}

/*
function updateLog(){
  var start = Object.keys(window).indexOf("studentVarToken")+1;
  var end = Object.keys(window).indexOf("__jsCB");
  var index;
  for(var i=start;i<end;i++){
    if(window[Object.keys(window)[i]] != undefined){
      if (typeof window[Object.keys(window)[i]] == "number" || typeof window[Object.keys(window)[i]] == "string"|| typeof window[Object.keys(window)[i]] == "boolean") {
        varLog[Object.keys(window)[i]] = window[Object.keys(window)[i]];
      }
    }
  }

  varWatchers(varLog);

  if(validationProps){//is Sprite Lab
    if(!validationProps.previous){
      validationProps.previous = {};
    }
    detectVarChange();
    validationProps.previous.varLog=JSON.parse(JSON.stringify(varLog));
  }
}
*/

function varWatchers(varLog){
  for(var key in varLog){
    var index = Object.keys(varLog).indexOf(key);
    var x = 5;
    var y = 32;
    drawWatcher(key, varLog[key], index, x, y);
  }
}

function drawWatcher(label, value, index, x, y){
  if(!value&&value!=0&&value!=''){
    value = 'undefined';
  }
  var fontSize=15;
  textSize(fontSize);
  textAlign(LEFT,CENTER);
  var labelX = x + 5;
  var valueX = x + 15 + textWidth(label);
  var textY = y + (index+0.5) * fontSize*2;
  stroke("#c6cacd");
  fill("#e7e8ea");
  rect(x,y + index * fontSize*2,textWidth(label)+textWidth(value)+25,fontSize*2, fontSize/2);
  noStroke();
  fill("#5b6770");
  text(label,labelX,textY);
  fill("#ffa400");
  rect(valueX - 5,y + (index+0.125) * fontSize*2,textWidth(value)+10,fontSize*1.5, fontSize/1.5);
  noStroke();
  fill("white");
  text(value,valueX,textY);
}

function checkLogLength(){
  return buildVariableLog().length >0;
}

function checkLogForChanges(){
  varLog = buildVariableLog();
  if(!previousVarLog){
    previousVarLog= {
      varLog:varLog,
      frame: World.frameCount,
    };
  }
  if(previousVarLog){
    if(JSON.stringify(previousVarLog.varLog) != JSON.stringify(varLog)){
      if(World.frameCount>previousVarLog.frame){
        previousVarLog=JSON.parse(JSON.stringify(varLog));
      }
      return true;
    }
  }
  return false;
}