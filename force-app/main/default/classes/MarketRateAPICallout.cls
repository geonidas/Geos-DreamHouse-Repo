public with sharing class MarketRateAPICallout {
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
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:FRED_Mortgage_Rates/series/observations?series_id=OBMMIC30YF&api_key=' + EncodingUtil.urlEncode(cfg.API_Key_String__c, 'UTF-8') + '&file_type=json&sort_order=desc&limit=1');
        req.setMethod('GET');
        req.setTimeout(20000);

        try{
            HttpResponse res = new Http().send(req);
            System.debug('Status: ' + res.getStatusCode() + ' ' + res.getStatus());
            System.debug('Body: ' + res.getBody());
        }
        catch (exception e){
            System.debug('Callout failed: ' + e.getTypeName() + ' - ' + e.getMessage());
        }
        
        FredObservationResponse syncedRateDataObj = FredObservationResponse.parse(res.getBody());

        Market_Rate__c latestRate = new Market_Rate__c(Mortgage_Rate__c = Decimal.valueOf(syncedRateDataObj.observations[0].value), Observation_Date__c = Date.valueOf(syncedRateDataObj.observations[0].observationDate));

    }
}