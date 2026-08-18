import { LightningElement, wire } from 'lwc';
import { getRecord } from "lightning/uiRecordApi";


const FIELDS = ['Mortgage_Rate__c', 'Observation_Date__c'];
export default class MarketRateCalculator extends LightningElement {

    recordId;

    @wire(getRecord, { recordId: "$recordId", fields:FIELDS})
    wiredMarketRateRecord;

    get mortgageRate() {
        return this.wiredMarketRateRecord.data?.fields?.Mortgage_Rate__c?.value;
    }

    get observationDate() {
        return this.wiredMarketRateRecord.data?.fields?.Observation_Date__c?.value;
    }
}