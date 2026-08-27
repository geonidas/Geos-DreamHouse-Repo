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
    
    termOptions = TERM_OPTIONS;
    
    @api recordId;

    @track downPaymentAmount = 0;
    @track termMonths = '360';
    @track rateOverride;

    @wire(getPropertyPrice, { propertyId: '$recordId'})
    wiredPropertyPrice;

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
        return (this.wiredMarketRateRecord.data == null && this.hasError === false)
            || (this.wiredPropertyPrice.data == null && this.wiredPropertyPrice.error == null);
    }

    get downPaymentPercent() {
        if (!this.propertyPrice) return 0;
        return Math.round((this.downPaymentAmount / this.propertyPrice) * 10000) / 100;
    }

    get effectiveRate() {
        return this.rateOverride != null ? this.rateOverride : this.mortgageRate;
    }

    get isOverridden() {
        return this.rateOverride != null;
    }

    get monthlyPayment() {
        if (!this.propertyPrice || !this.effectiveRate) {
            return undefined;
        }
        const principal = this.propertyPrice - this.downPaymentAmount;
        return calculateMonthlyPayment(principal, this.effectiveRate, Number(this.termMonths));
    }

    get propertyPrice() {
        return this.wiredPropertyPrice.data;
    }

    handleAmountChange(event) {
        this.downPaymentAmount = Number(event.target.value) || 0;
    }

    handlePercentChange(event) {
        const percent = Number(event.target.value) || 0;
        const rawAmount = this.propertyPrice ? (percent / 100) * this.propertyPrice : 0;
        this.downPaymentAmount = Math.round(rawAmount * 100) / 100;
    }

    handleSliderChange(event) {
        const percent = event.detail.value;
        const rawAmount = this.propertyPrice ? (percent / 100) * this.propertyPrice : 0;
        this.downPaymentAmount = Math.round(rawAmount * 100) / 100;

        const amountInput = this.template.querySelector('[data-id="downPaymentAmount"]');
        if (amountInput){
            amountInput.blur();
        }
    }

    handleTermChange(event) {
        this.termMonths = event.detail.value;
    }

    handleRateOverrideChange(event) {
        const raw = event.target.value;
        this.rateOverride = raw === '' ? undefined : Number(raw);
    }

    handleClearOverride() {
        this.rateOverride = undefined;
        const input = this.template.querySelector('[data-id="rateOverride"]');
        if (input) {
            input.value = '';
        }
    }
}

