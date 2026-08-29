/**
 * Tests for MarketRateAPICallout.syncLatestRate().
 *
 * NOTE: syncLatestRate() reads API_Credential__mdt.getInstance('FRED_Key').
 * Custom metadata records are visible in tests without SeeAllData, but they
 * cannot be inserted synchronously in a test — so these tests depend on that
 * record existing in the org. See the "missing credential" test below.
 */
@isTest
private class MarketRateAPICalloutTest {

    @isTest
    static void createsRecordFromValidResponse() {
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.validBody('2026-08-26', '6.721')));

        Test.startTest();
        MarketRateAPICallout.syncLatestRate();
        Test.stopTest();

        List<Market_Rate__c> rates = [
            SELECT Mortgage_Rate__c, Observation_Date__c, Rate_Key__c FROM Market_Rate__c
        ];

        Assert.areEqual(1, rates.size(), 'Exactly one rate record should be created');
        Assert.areEqual(6.721, rates[0].Mortgage_Rate__c,
            'Rate should be parsed from the string value');
        Assert.areEqual(Date.newInstance(2026, 8, 26), rates[0].Observation_Date__c,
            'Observation date should be parsed from the remapped date field');
        Assert.areEqual('OBMMIC30YF-2026-08-26', rates[0].Rate_Key__c,
            'External ID should combine series ID and observation date');
    }

    @isTest
    static void upsertIsIdempotentForSameDate() {
        // Running the job twice for the same observation date should update,
        // not duplicate. This is what the Rate_Key__c external ID buys us.
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.validBody('2026-08-26', '6.500')));

        insert new Market_Rate__c(
            Mortgage_Rate__c = 5.000,
            Observation_Date__c = Date.newInstance(2026, 8, 26),
            Rate_Key__c = 'OBMMIC30YF-2026-08-26'
        );

        Test.startTest();
        MarketRateAPICallout.syncLatestRate();
        Test.stopTest();

        List<Market_Rate__c> rates = [SELECT Mortgage_Rate__c FROM Market_Rate__c];

        Assert.areEqual(1, rates.size(), 'Re-running for the same date must not create a duplicate');
        Assert.areEqual(6.500, rates[0].Mortgage_Rate__c,
            'The existing record should have been updated with the new rate');
    }

    @isTest
    static void skipsMissingValueMarker() {
        // FRED publishes "." when no value exists for the date. No DML should occur.
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.validBody('2026-08-26', '.')));

        Test.startTest();
        MarketRateAPICallout.syncLatestRate();
        Test.stopTest();

        Assert.areEqual(0, [SELECT COUNT() FROM Market_Rate__c],
            'The "." missing-value marker should result in no record being created');
    }

    @isTest
    static void skipsEmptyObservationsList() {
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.emptyObservationsBody()));

        Test.startTest();
        MarketRateAPICallout.syncLatestRate();
        Test.stopTest();

        Assert.areEqual(0, [SELECT COUNT() FROM Market_Rate__c],
            'An empty observations array should result in no record being created');
    }

    @isTest
    static void throwsOnNonSuccessStatus() {
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(400, MarketRateCalloutMock.errorBody()));

        Boolean threw = false;
        Test.startTest();
        try {
            MarketRateAPICallout.syncLatestRate();
        } catch (CalloutException e) {
            threw = true;
            Assert.isTrue(e.getMessage().contains('FRED API call failed'),
                'Exception message should identify the failing integration');
        }
        Test.stopTest();

        Assert.isTrue(threw, 'A non-200 status should raise a CalloutException');
        Assert.areEqual(0, [SELECT COUNT() FROM Market_Rate__c],
            'No record should be created when the callout fails');
    }

    @isTest
    static void handlesUnauthorizedResponse() {
        Test.setMock(HttpCalloutMock.class, new MarketRateCalloutMock(401, '{"error":"unauthorized"}'));

        Boolean threw = false;
        Test.startTest();
        try {
            MarketRateAPICallout.syncLatestRate();
        } catch (CalloutException e) {
            threw = true;
        }
        Test.stopTest();

        Assert.isTrue(threw, 'A 401 should be surfaced as a CalloutException, not swallowed');
    }
}