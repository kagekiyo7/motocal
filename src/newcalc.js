function newCalcTotalDamage(totals, res, turn) {
    let {getTypeBonus, calcChainBurst} = require('./global_logic.js');
    let totalDamage = 0;
    // For calculate Chain.
    let countOugiPerTurn = 0;
    let totalOugiPerTurn = 0;

    // 奥義時の他キャラゲージボーナス。自分を含む既に奥義を行ったキャラには与えられない
    let getOugiGageBonus = (times = 1) => {
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].ougiGage += (res[key].attackMode != "ougi") ? Math.max(0, Math.ceil(10 * res[key].ougiGageBuff) * times) : 0;
                // 奥義ゲージ最大値を上回らないようにする
                res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
            }
        }
    };
    
    // 無名などの奥義効果 こちらは全員に反映される
    let getOugiGageUpOugiBuff = (times = 1) => {
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].ougiGage += Math.max(0, Math.ceil(res[key].ougiGageUpOugiBuff * res[key].ougiGageBuff) * times);
                // 奥義ゲージ最大値を上回らないようにする
                res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
            }
        }
    };
    
    for (let i = 0; i < turn; i++) {
        countOugiPerTurn = 0;
        totalOugiPerTurn = 0;
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // ougi attack (200%)
                if (res[key].ougiGage >= 200) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = 0;
                    totalDamage += res[key].ougiDamage * 2;
                    totalOugiPerTurn += res[key].ougiDamage * 2;
                    countOugiPerTurn += 2;
                    getOugiGageBonus(2);
                    // Temporary implementation
                    if (key == "Djeeta" && res[key].ougiGageUpOugiBuff) getOugiGageUpOugiBuff(2);
                // ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = Math.max(0, res[key].ougiGage - 100);
                    totalDamage += res[key].ougiDamage;
                    totalOugiPerTurn += res[key].ougiDamage;
                    countOugiPerTurn += 1;
                    getOugiGageBonus(1);
                    if (key == "Djeeta" && res[key].ougiGageUpOugiBuff) getOugiGageUpOugiBuff(1);
                // normal attack
                } else {
                    res[key].attackMode = "normal";
                    totalDamage += res[key].damageWithMultiple;
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage + res[key].expectedOugiGage);
                }
            }
        }

        // ターン終了時処理
        // chain burst
        if (countOugiPerTurn > 1) totalDamage += res["Djeeta"].chainBurstSupplemental + calcChainBurst(totalOugiPerTurn, countOugiPerTurn, getTypeBonus(totals["Djeeta"].element, res["Djeeta"].enemyElement), res["Djeeta"].skilldata.enemyResistance, res["Djeeta"].skilldata.chainDamageUP, res["Djeeta"].skilldata.chainDamageLimit);
        
        for (let key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].attackMode = "";
            }
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
