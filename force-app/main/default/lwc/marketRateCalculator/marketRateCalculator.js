import { LightningElement, wire } from 'lwc';
import getLatestMarketRate from '@salesforce/apex/MarketRateController.getLatestMarketRate';

export default class MarketRateCalculator extends LightningElement {

    @wire(getLatestMarketRate)
    wiredMarketRateRecord;

    get mortgageRate() {
        return this.wiredMarketRateRecord.data?.Mortgage_Rate__c;
    }

    get observationDate() {
        return this.wiredMarketRateRecord.data?.fields?.Observation_Date__c;
    }

    get hasError() {
        return this.wiredMarketRateRecord.error != null;
    }

    get isLoading() {
        return this.wiredMarketRateRecord.data == null && this.hasError === false;
    }
}