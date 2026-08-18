public with sharing class MarketRateController {
    
    @AuraEnabled(cacheable=true)
    public static Market_Rate__c getLatestMarketRate(){
        Market_Rate__c marketRate = [
            SELECT Id, Mortgage_Rate__c, Observation_Date__c 
            FROM Market_Rate__c 
            ORDER BY Observation_Date__c DESC 
            LIMIT 1
        ];
        return marketRate;
    }
}