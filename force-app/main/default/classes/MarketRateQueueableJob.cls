public with sharing class MarketRateQueueableJob implements Queueable, Database.AllowsCallouts {
    public void execute(QueueableContext qc){
        MarketRateAPICallout.syncLatestRate();
    }
}