function newCalcTotalDamage(totals, res, turn) {
    let totalDamage = 0;
    let countOugi = 0;
    
    // 他キャラ奥義時のゲージボーナス
    let getOugiGageBonus = (times) => {
        let value = 0;
        for (key in res) {
            value += (res[key].attackMode != "ougi") ? Math.max(0, Math.ceil(10 * res[key].ougiGageBuff) * times) : 0;
            // 奥義ゲージ最大値を上回らないようにする
            value = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
        }
    }
       
    for (let i = 0; i < turn; i++){
	countOugi = 0;
        for (key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                // ougi attack (200%)
                if (res[key].ougiGage >= 200) {
                    res[key].ougiGage = 0;
                    totalDamage += res[key].ougiDamage * 2;
                    countOugi += 2;
                    res[key].attackMode = "ougi"
                    getOugiGageBonus(2);
                // ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].ougiGage -= 100;
                    res[key].ougiGage = Math.max(0, res[key].ougiGage);
                    totalDamage += res[key].ougiDamage;
                    countOugi += 1;
                    res[key].attackMode = "ougi"
                    getOugiGageBonus();
                // normal attack
                } else {
                    totalDamage += res[key].damageWithMultiple;
                    res[key].ougiGage += res[key].expectedOugiGage;
                    res[key].ougiGage = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
                    res[key].attackMode = "normal"
                }
            }
        }
        
	// ターン終了時処理
        for (key in res) {
            // chain attack
            if (countOugi === 2) {
                totalDamage += res[key].twoChainBurst / 4;
            } else if (countOugi === 3) {
                totalDamage += res[key].threeChainBurst / 4;
            } else if (countOugi >= 4) {
                totalDamage += res[key].fourChainBurst / 4;
            }
            res[key].attackMode = ""
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
