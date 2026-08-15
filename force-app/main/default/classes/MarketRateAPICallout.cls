public with sharing class MarketRateAPICallout {

    private static final String SERIES_ID = 'OBMMIC30YF';
    public class FredObservationResponse {
        public List<Observation> observations;

        public class Observation {
            public String observationDate;  // renamed from "date"
            public String value;
        }

        public static FredObservationResponse parse(String body) {
            return (FredObservationResponse) JSON.deserialize(
                body.replace('"date"', '"observationDate"'),
                FredObservationResponse.class
            );
        }
    }
    public static void syncLatestRate(){
        API_Credential__mdt cfg = API_Credential__mdt.getInstance('FRED_Key');
        if(cfg == null || String.isBlank(cfg.API_Key_String__c)){
            throw new CalloutException('FRED API Key not configured');
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:FRED_Mortgage_Rates/series/observations?'
            + 'series_id=' + SERIES_ID 
            + '&api_key=' + EncodingUtil.urlEncode(cfg.API_Key_String__c.trim(), 'UTF-8') 
            + '&file_type=json'
            + '&sort_order=desc'
            + '&limit=1');
        req.setMethod('GET');
        req.setTimeout(20000);

        HttpResponse res = new Http().send(req);
        if(res.getStatusCode() != 200){
            throw new CalloutException('FRED API call failed: HTTP ' + res.getStatus() + ' ' + res.getStatus());
        }
        System.debug('Status: ' + res.getStatusCode() + ' ' + res.getStatus());
        System.debug('Body: ' + res.getBody());
        
        FredObservationResponse parsed = FredObservationResponse.parse(res.getBody());
        if (parsed.observations == null || parsed.observations.isEmpty()){
            return; //nothing published yet
        }

        FredObservationResponse.Observation obs = parsed.observations[0];
        if(String.isBlank(obs.value) || obs.value == '.'){
            return; //FREDs documented missing-value marker
        }

        Market_Rate__c rate = new Market_Rate__c(Mortgage_Rate__c = Decimal.valueOf(obs.value), Observation_Date__c = Date.valueOf(obs.observationationDate));

        upsert rate Rate_Key__c;
    }
}