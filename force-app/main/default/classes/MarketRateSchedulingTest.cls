/**
 * Tests for the async plumbing: MarketRateQueueableJob and MarketRateCalloutScheduler.
 *
 * These classes are deliberately thin, so the tests are correspondingly small —
 * they verify the handoff happens, not the business logic (covered in
 * MarketRateAPICalloutTest).
 */
@isTest
private class MarketRateSchedulingTest {

    @isTest
    static void queueableRunsSyncAndCreatesRecord() {
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.validBody('2026-08-26', '6.333')));

        Test.startTest();
        System.enqueueJob(new MarketRateQueueableJob());
        Test.stopTest();   // queued job executes here

        List<Market_Rate__c> rates = [SELECT Mortgage_Rate__c FROM Market_Rate__c];

        Assert.areEqual(1, rates.size(), 'Queueable should have run the sync');
        Assert.areEqual(6.333, rates[0].Mortgage_Rate__c,
            'The rate from the mocked response should be persisted');
    }

    @isTest
    static void schedulerRegistersCronTrigger() {
        Test.setMock(HttpCalloutMock.class,
            new MarketRateCalloutMock(200, MarketRateCalloutMock.validBody('2026-08-26', '6.100')));

        String cronExpression = '0 0 8 * * ?';   // daily at 08:00 org time

        Test.startTest();
        String jobId = System.schedule(
            'FRED Daily Rate Sync Test',
            cronExpression,
            new MarketRateCalloutScheduler()
        );
        Test.stopTest();

        CronTrigger ct = [
            SELECT Id, CronExpression, TimesTriggered
            FROM CronTrigger
            WHERE Id = :jobId
        ];

        Assert.areEqual(cronExpression, ct.CronExpression,
            'The scheduled job should be registered with the supplied cron expression');
        Assert.areEqual(0, ct.TimesTriggered,
            'The job should not have fired on its own schedule during the test');
    }
}