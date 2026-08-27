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
    @api propertyPrice = 350000;

    @track downPaymentAmount = 0;
    @track termMonths = '360';

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
        return Math.round((this.downPaymentAmount / this.propertyPrice) * 10000) / 100;
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

    get monthlyPayment() {
        if (!this.propertyPrice || !this.mortgageRate) {
            return undefined;
        }
        const principal = this.propertyPrice - this.downPaymentAmount;
        return calculateMonthlyPayment(principal, this.mortgageRate, Number(this.termMonths));
    }

}

