function newCalcTotalDamage(totals, res, buff, turn) {
    let totalDamage = 0;
    let countOugi = 0;

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
    
    // DATA奥義効果を加味したexpectedAttack計算 全体バフを効果ターン3で行う
    let calcExpectedAttack = () => {
        let totalDA = Math.max(0, res[key].totalDA - buff["da"]);
        let totalTA = Math.max(0, res[key].totalTA - buff["ta"]);
        if (res["Djeeta"].countDATA) {
            totalDA = res[key].totalDA;
            totalTA = res[key].totalTA;
        }
        let taRate = Math.max(0, Math.min(1.0, Math.floor(totalTA * 100) / 100));
        let daRate = Math.max(0, Math.min(1.0, Math.floor(totalDA * 100) / 100));
        return 3.0 * taRate + (1.0 - taRate) * (2.0 * daRate + (1.0 - daRate));
    }
    
    
    for (let i = 0; i < turn; i++) {
         countOugi = 0;
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // ougi attack (200%)
                if (res[key].ougiGage >= 200) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = 0;
                    totalDamage += res[key].ougiDamage * 2;
                    countOugi += 2;
                    getOugiGageBonus(2);
                    getOugiGageUpOugiBuff(2)
                // ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].attackMode = "ougi";
                    res[key].ougiGage = Math.max(0, res[key].ougiGage - 100);
                    totalDamage += res[key].ougiDamage;
                    countOugi += 1;
                    getOugiGageBonus(1)
                    getOugiGageUpOugiBuff(1);
                // normal attack
                } else {
                    res[key].attackMode = "normal";
                    totalDamage += res[key].pureDamage * calcExpectedAttack();
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage + res[key].expectedOugiGage);
                }
                if (res[key].attackMode = "ougi" && key == "Djeeta") {
                    res["Djeeta"].countDATA = 3;
                }
            }
        }

        // ターン終了時処理
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // chain attack
                if (countOugi === 2 && res[key].attackMode === "ougi") {
                    totalDamage += res[key].twoChainBurst / 2;
                } else if (countOugi === 3 && res[key].attackMode === "ougi") {
                    totalDamage += res[key].threeChainBurst / 3;
                } else if (countOugi >= 4 && res[key].attackMode === "ougi") {
                    totalDamage += res[key].fourChainBurst / 4;
                }
                res[key].attackMode = "";
                if (res[key].countDATA) res[key].countDATA - 1;
            }
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
