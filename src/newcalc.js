function newCalcTotalDamage(totals, res, turn) {
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
                    totalDamage += res[key].damageWithMultiple;
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage + res[key].expectedOugiGage);
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
            }
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
