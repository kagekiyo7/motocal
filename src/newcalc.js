function newCalcTotalDamage(totals, res, buff, turn) {
    const {getTypeBonus, calcChainBurst} = require('./global_logic.js');
    let totalDamage = 0;
    // For calculate Chain.
    let countOugiPerTurn = 0;
    let totalOugiPerTurn = 0;

    // Gain gauge bonus for other character when ougi. 
    // Cannot be given to characters that have already performed ougi, including yourself.
    const getOugiGageBonus = (times = 1) => {
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                let ougiGageUp = Math.ceil(10 * res[key].ougiGageBuff);
                if (res[key].attackMode != "ougi") res[key].ougiGage = Math.min(res[key].ougiGageLimit, Math.max(0, res[key].ougiGage + (ougiGageUp * times)));
            }
        }
    };
    
    // Gain gauge bonus for all character when ougi effect of Unsigned Kaneshige(無銘金重) etc. 
    const getOugiGageUpOugiBuff = (times = 1) => {
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                let ougiGageUp = Math.ceil(res[key].ougiGageUpOugiBuff * res[key].ougiGageBuff);
                res[key].ougiGage = Math.min(res[key].ougiGageLimit, Math.max(0, res[key].ougiGage + (ougiGageUp * times)));
            }
        }
    };
    
    for (let key in res) {
        if (totals[key]["isConsideredInAverage"]) {
            res[key].ougiGageLimit = (totals[key]["job"]["name"] == "剣豪" ||totals[key]["job"]["name"] == "侍" || key == "ヴァジラ" || key == "サーヴァンツ ドロシー＆クラウディア" 
            || key == "[最終]オクトー" || key == "オクトー" || key == "サビルバラ(イベントver)" || key == "サビルバラ" 
            || key == "ジン(克己浪人)" || key == "ジン(風属性ver)" || key == "ミリン" || key == "ミリン(光属性ver)") ? 200 : 100;
            res[key].ougiGage = (key == "Djeeta") ? 100 : 30;
            res[key].attackMode = "";
            res[key].countDATA = 0;
        }
    }
    
    // DATA奥義効果を加味したexpectedAttack, expectedOugiGage(-高揚)計算 全体バフを効果ターン3で行う
    let calcExpectedAttack = (key) => {
        let ougiGageBuff = res[key].ougiGageBuff;
        let TArandomNumber = Math.floor(Math.random() * 101) / 100;
        let DArandomNumber = Math.floor(Math.random() * 101) / 100;
        let totalTA = (res["Djeeta"].countDATA > 0) ? res[key].totalTA : (res[key].totalTA - buff["ta"]);
        let totalDA = (res["Djeeta"].countDATA > 0) ? res[key].totalDA : (res[key].totalDA - buff["da"]);
        let taRate = Math.max(0, Math.min(1.0, Math.floor(totalTA * 100) / 100));
        let daRate = Math.max(0, Math.min(1.0, Math.floor(totalDA * 100) / 100));
        
        if (TArandomNumber <= taRate) {
            res[key].expectedOugiGageByAttack = Math.ceil(37.0 * ougiGageBuff);
            res[key].newExpectedAttack = 3.0;
        } else if (DArandomNumber <= daRate) {
            res[key].expectedOugiGageByAttack = Math.ceil(22.0 * ougiGageBuff);
            res[key].newExpectedAttack = 2.0;
        } else {
            res[key].expectedOugiGageByAttack = Math.ceil(10.0 * ougiGageBuff);
            res[key].newExpectedAttack = 1.0;
        }
    }
    
    
    for (let i = 0; i < turn; i++) {
        // Processing at start of turn.
        countOugiPerTurn = 0;
        totalOugiPerTurn = 0;
        
        // Processing for each character.
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // Ougi attack (200%)
                if (res[key].ougiGage >= 200) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = 0;
                    totalDamage += res[key].ougiDamage * 2;
                    totalOugiPerTurn += res[key].ougiDamage * 2;
                    countOugiPerTurn += 2;
                    getOugiGageBonus(2);
                    // Temporary implementation
                    if (key == "Djeeta" && res[key].ougiGageUpOugiBuff) getOugiGageUpOugiBuff(2);
                // Ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = Math.max(0, res[key].ougiGage - 100);
                    totalDamage += res[key].ougiDamage;
                    totalOugiPerTurn += res[key].ougiDamage;
                    countOugiPerTurn += 1;
                    getOugiGageBonus(1);
                    if (key == "Djeeta" && res[key].ougiGageUpOugiBuff) getOugiGageUpOugiBuff(1);
                // Normal attack
                } else {
                    res[key].attackMode = "normal";
                    calcExpectedAttack(key);
                    totalDamage += res[key].damageWithCritical * res[key].newExpectedAttack;
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, Math.max(0, res[key].ougiGage + res[key].expectedOugiGageByAttack));
                }
                if (res[key].attackMode == "ougi" && key == "Djeeta") {
                    res["Djeeta"].countDATA = 3;
                }
            }
        }

        // Processing at end of turn.
        // Chain burst
        if (countOugiPerTurn > 1) totalDamage += res["Djeeta"].chainBurstSupplemental + calcChainBurst(totalOugiPerTurn, countOugiPerTurn, getTypeBonus(totals["Djeeta"].element, res["Djeeta"].enemyElement), res["Djeeta"].skilldata.enemyResistance, res["Djeeta"].skilldata.chainDamageUP, res["Djeeta"].skilldata.chainDamageLimit);
        
        res["Djeeta"].countDATA -= 1;
        
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].attackMode = "";
                // Give uplift(高揚) effect.
                if (res[key].uplift) {
                    let uplift = Math.ceil(res[key].uplift * res[key].ougiGageBuff);
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, Math.max(0, res[key].ougiGage + uplift));
                }
            }
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
