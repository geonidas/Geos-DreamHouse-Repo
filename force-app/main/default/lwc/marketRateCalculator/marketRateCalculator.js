import { LightningElement, wire, api, track } from 'lwc';
import { calculateMonthlyPayment } from './mortgageMath';
import getLatestMarketRate from '@salesforce/apex/MarketRateController.getLatestMarketRate';
import getPropertyPrice from '@salesforce/apex/PropertyController.getPropertyPrice';

const TERM_OPTIONS = [
    { label: '30-Year Fixed', value: '360' },
    { label: '15-Year Fixed', value: '180' },
    { label: '10-Year Fixed', value: '120' }
];

export default class MarketRateCalculator extends LightningElement {

    //@wire(getPropertyPrice)
    @api propertyPrice;

    @track downPaymentAmount = 0;
    @track termMonths = 360;

    termOptions = TERM_OPTIONS;

    @wire(getLatestMarketRate)
    wiredMarketRateRecord;

    get mortgageRate() {
        return this.wiredMarketRateRecord.data?.Mortgage_Rate__c;
    }

    get observationDate() {
        return this.wiredMarketRateRecord.data?.Observation_Date__c;
    }

    get hasError() {
        return this.wiredMarketRateRecord.error != null;
    }

    get isLoading() {
        return this.wiredMarketRateRecord.data == null && this.hasError === false;
    }

    get downPaymentPercent() {
        if (!this.propertyPrice) return 0;
        return (this.downPaymentAmount / this.propertyPrice) * 100;
    }

    handleAmountChange(event) {
        this.downPaymentAmount = Number(event.target.value) || 0;
    }

    handlePercentChange(event) {
        const percent = Number(event.target.value) || 0;
        this.downPaymentAmount = this.propertyPrice
            ? (percent / 100) * this.propertyPrice
            : 0;
    }

    handleSliderChange(event) {
        // slider drives percent, same conversion as the percent field
        this.handlePercentChange(event);
    }

    handleTermChange(event) {
        this.termMonths = Number(event.detail.value);
    }

    get monthlyPayment() {
        if (!this.propertyPrice || !this.mortgageRate) {
            return undefined;
        }
        const principal = this.propertyPrice - (this.downPayment || 0);
        return calculateMonthlyPayment(principal, this.mortgageRate, this.termMonths);
    }

}

