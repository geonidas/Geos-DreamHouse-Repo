/**
 * Tests for MarketRateController.getLatestMarketRate().
 */
@isTest
private class MarketRateControllerTest {

    @isTest
    static void returnsMostRecentRateByObservationDate() {
        insert new List<Market_Rate__c>{
            new Market_Rate__c(
                Mortgage_Rate__c = 6.100,
                Observation_Date__c = Date.newInstance(2026, 8, 24),
                Rate_Key__c = 'OBMMIC30YF-2026-08-24'
            ),
            new Market_Rate__c(
                Mortgage_Rate__c = 6.750,
                Observation_Date__c = Date.newInstance(2026, 8, 26),
                Rate_Key__c = 'OBMMIC30YF-2026-08-26'
            ),
            new Market_Rate__c(
                Mortgage_Rate__c = 6.400,
                Observation_Date__c = Date.newInstance(2026, 8, 25),
                Rate_Key__c = 'OBMMIC30YF-2026-08-25'
            )
        };

        Test.startTest();
        Market_Rate__c result = MarketRateController.getLatestMarketRate();
        Test.stopTest();

        Assert.areEqual(6.750, result.Mortgage_Rate__c,
            'Should return the rate with the latest observation date, not the last inserted');
        Assert.areEqual(Date.newInstance(2026, 8, 26), result.Observation_Date__c,
            'Ordering should be by Observation_Date__c descending');
    }

    @isTest
    static void returnsSingleRecordWhenOnlyOneExists() {
        insert new Market_Rate__c(
            Mortgage_Rate__c = 6.250,
            Observation_Date__c = Date.today(),
            Rate_Key__c = 'OBMMIC30YF-' + String.valueOf(Date.today())
        );

        Market_Rate__c result = MarketRateController.getLatestMarketRate();

        Assert.isNotNull(result, 'A single existing record should be returned');
        Assert.areEqual(6.250, result.Mortgage_Rate__c, 'Rate should match the inserted value');
    }

    @isTest
    static void returnsNullWhenNoRatesExist() {
        // A fresh org before the first scheduled sync. This is a normal state,
        // not an error - the LWC renders it as "rate unavailable".
        Test.startTest();
        Market_Rate__c result = MarketRateController.getLatestMarketRate();
        Test.stopTest();

        Assert.isNull(result,
            'With no Market_Rate__c records, the controller should return null rather than throw');
    }

    @isTest
    static void skipsRecordsWithNullRate() {
        // Guards against a record with a null Mortgage_Rate__c shadowing an
        // older record that does have a usable value.
        insert new List<Market_Rate__c>{
            new Market_Rate__c(
                Mortgage_Rate__c = 6.500,
                Observation_Date__c = Date.newInstance(2026, 8, 25),
                Rate_Key__c = 'OBMMIC30YF-2026-08-25'
            ),
            new Market_Rate__c(
                Mortgage_Rate__c = null,
                Observation_Date__c = Date.newInstance(2026, 8, 26),
                Rate_Key__c = 'OBMMIC30YF-2026-08-26'
            )
        };

        Market_Rate__c result = MarketRateController.getLatestMarketRate();

        Assert.isNotNull(result, 'A usable older rate should be returned');
        Assert.areEqual(6.500, result.Mortgage_Rate__c,
            'Records with a null rate should be filtered out by the WHERE clause');
        Assert.areEqual(Date.newInstance(2026, 8, 25), result.Observation_Date__c,
            'The most recent record with an actual rate value should win');
    }
}