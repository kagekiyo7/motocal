function newCalcTotalDamage(totals, res, turn) {
    let {getTypeBonus, calcChainBurst} = require('./global_logic.js');
    let totalDamage = 0;
    let countOugi = 0;
    // For calculate Chain.
    let totalOugiPerTurn = 0;

    // 奥義時の他キャラゲージボーナス。自分を含む既に奥義を行ったキャラには与えられない
    let getOugiGageBonus = (times = 1) => {
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].ougiGage += (res[key].attackMode != "ougi") ? Math.max(0, Math.ceil(10 * res[key].ougiGageBuff) * times) : 0;
                // 奥義ゲージ最大値を上回らないようにする
                res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
            }
        }
    };
    
    // 無名などの奥義効果 こちらは自分にも反映される
    let getOugiGageUpOugiBuff = (times = 1) => {
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].ougiGage += Math.max(0, Math.ceil(res[key].ougiGageUpOugiBuff * res[key].ougiGageBuff) * times);
                // 奥義ゲージ最大値を上回らないようにする
                res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
            }
        }
    };
    
    for (let i = 0; i < turn; i++) {
        countOugi = 0;
        totalOugiPerTurn = 0;
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // ougi attack (200%)
                if (res[key].ougiGage >= 200) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = 0;
                    totalDamage += res[key].ougiDamage * 2;
                    totalOugiPerTurn += res[key].ougiDamage * 2;
                    countOugi += 2;
                    getOugiGageBonus(2);
                    getOugiGageUpOugiBuff(2)
                // ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = Math.max(0, res[key].ougiGage - 100);
                    totalDamage += res[key].ougiDamage;
                    totalOugiPerTurn += res[key].ougiDamage;
                    countOugi += 1;
                    getOugiGageBonus(1)
                    getOugiGageUpOugiBuff(1);
                // normal attack
                } else {
                    res[key].attackMode = "normal";
                    totalDamage += res[key].damageWithMultiple;
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage + res[key].expectedOugiGage);
                }
            }
        }

        // ターン終了時処理
            // chain attack
        if (countOugi === 2 && res[key].attackMode === "ougi") {
            totalDamage += calcChainBurst(totalOugiPerTurn, 2, getTypeBonus(totals[key].element, res["Djeeta"].enemyElement), res[key].skilldata.enemyResistance, res["Djeeta"].skilldata.chainDamageUP, res["Djeeta"].skilldata.chainDamageLimit);
        } else if (countOugi === 3 && res[key].attackMode === "ougi") {
            totalDamage += calcChainBurst(totalOugiPerTurn, 3, getTypeBonus(totals[key].element, res["Djeeta"].enemyElement), res[key].skilldata.enemyResistance, res["Djeeta"].skilldata.chainDamageUP, res["Djeeta"].skilldata.chainDamageLimit);
        } else if (countOugi >= 4 && res[key].attackMode === "ougi") {
            totalDamage += calcChainBurst(totalOugiPerTurn, 4, getTypeBonus(totals[key].element, res["Djeeta"].enemyElement), res[key].skilldata.enemyResistance, res["Djeeta"].skilldata.chainDamageUP, res["Djeeta"].skilldata.chainDamageLimit);
        }
        
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                res[key].attackMode = "";
            }
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
