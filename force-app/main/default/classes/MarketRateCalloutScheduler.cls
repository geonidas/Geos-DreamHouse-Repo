public with sharing class MarketRateCalloutScheduler implements Schedulable{
    public void execute(SchedulableContext sc) { 
        System.enqueueJob(new MarketRateQueueableJob());
    }
}