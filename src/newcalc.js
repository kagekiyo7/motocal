function newCalcTotalDamage(totals, res, turn) {
    let totalDamage = 0;
    let countOugi = 0;
    
    // 他キャラ奥義時のゲージボーナス
    let getOugiGageBonus = () => {
        let value = 0;
        for (key in res) {
            value += (res[key].attackMode != "ougi") ? Math.max(0, Math.ceil(10 * res[key].ougiGageBuff)) : 0;
            // 奥義ゲージ最大値を上回らないようにする
            value = Math.min(res[key].ougiGageLimit, res[key].ougiGage);
        }
        return value;
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
                    res[key].ougiGage += getOugiGageBonus() * 2;
                // ougi attack (100%)
                } else if (res[key].ougiGage >= 100) {
                    res[key].ougiGage -= 100;
                    res[key].ougiGage = Math.max(0, ougiGage);
                    totalDamage += res[key].ougiDamage;
                    countOugi += 1;
                    res[key].attackMode = "ougi"
                    res[key].ougiGage += getOugiGageBonus();
                // normal attack
                } else {
                    totalDamage += res[key].damageWithMultiple;
                    res[key].ougiGage += res[key].expectedOugiGage;
                    res[key].attackMode = "normal"
                }
            }
        }
        
        // chain attack
        if (countOugi === 2) {
            totalDamage += res["Djeeta"].twoChainBurst;
        } else if (countOugi === 3) {
            totalDamage += res["Djeeta"].threeChainBurst;
        } else if (countOugi >= 4) {
            totalDamage += res["Djeeta"].fourChainBurst;
        }
        
        for (key in res) {
            res[key].attackMode = ""
        }
    }
    return totalDamage / turn;
}

module.exports.newCalcTotalDamage = newCalcTotalDamage;
