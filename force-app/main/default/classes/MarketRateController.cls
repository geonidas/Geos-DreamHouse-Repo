public with sharing class MarketRateController {

    @AuraEnabled(cacheable = true)
    public static Market_Rate__c getLatestMarketRate() {
        List<Market_Rate__c> rates = [
            SELECT Id, Mortgage_Rate__c, Observation_Date__c
            FROM Market_Rate__c
            WHERE Mortgage_Rate__c != NULL
            ORDER BY Observation_Date__c DESC
            LIMIT 1
        ];

        return rates.isEmpty() ? null : rates[0];
    }
}