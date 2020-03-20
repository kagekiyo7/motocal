function newCalcTotalDamage(totals, res, turn) {
    const {getTypeBonus, calcChainBurst} = require('./global_logic.js');
    /* // Depends on environment
    const loadTime = 4.0; //ブラバ4.0、リロ5.3 */
    
    // Calculate expectedOugiGage (minus uplift)
    const calcExpectedOugiGageByAttack = (daRate, taRate, ougiGageBuff) => { 
        return (taRate * Math.ceil(37.0 * ougiGageBuff) + (1.0 - taRate) * (daRate * Math.ceil(22.0 * ougiGageBuff) + (1.0 - daRate) * Math.ceil(10.0 * ougiGageBuff)));
    }
    
    // Define charactors
    const getCharacters = () => {
        const charactors = {};
        for (const key in res) {
            if (totals[key]["isConsideredInAverage"]) {
                charactors[key] = res[key];//JSON.parse(JSON.stringify(res[key]));
                charactors[key].ougiGageLimit = (totals[key]["job"]["name"] == "剣豪" ||totals[key]["job"]["name"] == "侍" 
                    || key == "ヴァジラ" || key == "サーヴァンツ ドロシー＆クラウディア" 
                    || key == "[最終]オクトー" || key == "オクトー" || key == "サビルバラ(イベントver)" || key == "サビルバラ" 
                    || key == "ジン(克己浪人)" || key == "ジン(風属性ver)" || key == "ミリン" || key == "ミリン(光属性ver)") ? 200 : 100;
                charactors[key].ougiGage = (key == "Djeeta") ? 100 : 30;
                // attackMode is prepared for function getOugiGageBonus.
                charactors[key].attackMode = "";
                charactors[key].expectedOugiGageByAttack = calcExpectedOugiGageByAttack(res[key].totalDA, res[key].totalTA, res[key].ougiGageBuff);
            }
        }
        console.log(charactors);
        return charactors;
    }
    
    // Give other characters ougi gauge bonus when do ougi. 
    // Cannot be given to characters that have already did ougi, including the did ougi character.
    const giveOugiGageBonus = (charactors, times) => {
        for (const key in charactors) {
            const {ougiGageBuff, attackMode, ougiGage, ougiGageLimit} = charactors[key];
            const ougiGageUp = Math.ceil(10 * ougiGageBuff);
            if (attackMode != "ougi") charactors[key].ougiGage = Math.min(ougiGageLimit, Math.max(0, ougiGage + (ougiGageUp * times)));
        }
    }
    
    // Give all character ougi gauge bonus when do ougi effect of Unsigned Kaneshige(無銘金重) etc. 
    const giveOugiGageUpOugiBuff = (charactors, times) => {
        for (const key in charactors) {
            const {ougiGageUpOugiBuff, ougiGageBuff, ougiGageLimit, ougiGage} = charactors[key];
            const ougiGageUp = Math.ceil(ougiGageUpOugiBuff * ougiGageBuff);
            charactors[key].ougiGage = Math.min(ougiGageLimit, Math.max(0, ougiGage + (ougiGageUp * times)));
        }
    }
    
    const calcDamagePerLockoutTime = (turn) => {
        const charactors = getCharacters();
        let totalDamage = 0;
        let countOugiPerTurn = 0;
        let ougiDamagePerTurn = 0;
        let totalLockoutTime = 0;
        let lockoutTimePerTurn = 0;
        
        // Processing for each turns.
        for (let i = 0; i < turn; i++) {
            // Processing at start of turn. Initialize numbers.
            countOugiPerTurn = 0;
            ougiDamagePerTurn = 0;
            lockoutTimePerTurn = 1.0; // 1.0 is base.
            
            // Processing attack for each characters.
            for (let key in charactors) {
                const {damage, ougiDamage, ougiGageUpOugiBuff, expectedAttack, ougiGageLimit, expectedOugiGageByAttack} = charactors[key];
            // Ougi Attack (200%)
                if (charactors[key].ougiGage >= 200) {
                    charactors[key].attackMode = "ougi";
                    charactors[key].ougiGage = 0;
                    totalDamage += ougiDamage * 2;
                    ougiDamagePerTurn += ougiDamage * 2;
                    countOugiPerTurn += 2;
                    giveOugiGageBonus(charactors, 2);
                    if (key == "Djeeta" && ougiGageUpOugiBuff) giveOugiGageUpOugiBuff(charactors, 2);
            // Ougi Attack (100%)
                } else if (charactors[key].ougiGage >= 100) {
                    charactors[key].attackMode = "ougi";
                    charactors[key].ougiGage = Math.max(0, charactors[key].ougiGage - 100);
                    totalDamage += ougiDamage;
                    ougiDamagePerTurn += ougiDamage;
                    countOugiPerTurn += 1;
                    giveOugiGageBonus(charactors, 1);
                    if (key == "Djeeta" && ougiGageUpOugiBuff) giveOugiGageUpOugiBuff(charactors, 1);
            // Normal Attack
                } else {
                    charactors[key].attackMode = "normal";
                    totalDamage += damage;
                    charactors[key].ougiGage = Math.min(ougiGageLimit, Math.max(0, charactors[key].ougiGage + expectedOugiGageByAttack));
                    lockoutTimePerTurn += 0.35 * expectedAttack;
                }
            }
        
            // Processing at end of turn.
            // Chain Burst Damage.
            if (countOugiPerTurn > 1) {
                totalDamage += charactors["Djeeta"].chainBurstSupplemental + calcChainBurst(ougiDamagePerTurn, countOugiPerTurn, getTypeBonus(totals["Djeeta"].element, charactors["Djeeta"].enemyElement), charactors["Djeeta"].skilldata.enemycharactorsistance, charactors["Djeeta"].skilldata.chainDamageUP, charactors["Djeeta"].skilldata.chainDamageLimit);
            }
            
            // Add ougi lockoutTime.
            switch (countOugiPerTurn) {
                case 0: break;
                case 1: lockoutTimePerTurn += 1.7; break;
                case 2: lockoutTimePerTurn += 5.4; break;
                case 3: lockoutTimePerTurn += 8.1; break;
                case 4: lockoutTimePerTurn += 10.8; break;
                //case 5 or more.
                default: lockoutTimePerTurn += 11.3; break;
            }
            
            totalLockoutTime += lockoutTimePerTurn;
            
            for (const key in charactors) {
                // Reset attackMode;
                charactors[key].attackMode = "";
                
                // Give uplift(高揚) effect.
                if (charactors[key].uplift) {
                    let uplift = Math.ceil(charactors[key].uplift * charactors[key].ougiGageBuff);
                    charactors[key].ougiGage = Math.min(charactors[key].ougiGageLimit, Math.max(0, charactors[key].ougiGage + uplift));
                }
            }
        }
        
        // Debug
        console.log("--------");
        for (const key in charactors) {
            for (const item in charactors[key]) {
                console.log(item + ": "+ charactors[key][item]);
            }
        }
        
        return totalDamage / totalLockoutTime;
    }
    return calcDamagePerLockoutTime(turn);
}


module.exports.newCalcTotalDamage = newCalcTotalDamage;
