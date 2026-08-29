/**
 * Reusable HTTP callout mock for FRED API tests.
 *
 * Takes status code and body as constructor arguments so a single mock class
 * covers success, error, and edge-case responses without a separate mock per test.
 */
@isTest
public class MarketRateCalloutMock implements HttpCalloutMock {

    private Integer statusCode;
    private String body;
    private String status;

    public MarketRateCalloutMock(Integer statusCode, String body) {
        this.statusCode = statusCode;
        this.body = body;
        this.status = statusCode == 200 ? 'OK' : 'Error';
    }

    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(this.statusCode);
        res.setStatus(this.status);
        res.setBody(this.body);
        res.setHeader('Content-Type', 'application/json');
        return res;
    }

    // ---- Canned response bodies, matching FRED's documented v1 shape ----

    public static String validBody(String observationDate, String value) {
        return '{'
            + '"realtime_start":"2026-08-27",'
            + '"realtime_end":"2026-08-27",'
            + '"observation_start":"1776-07-04",'
            + '"observation_end":"9999-12-31",'
            + '"units":"lin",'
            + '"output_type":1,'
            + '"file_type":"json",'
            + '"order_by":"observation_date",'
            + '"sort_order":"desc",'
            + '"count":1873,'
            + '"offset":0,'
            + '"limit":1,'
            + '"observations":[{'
                + '"realtime_start":"2026-08-27",'
                + '"realtime_end":"2026-08-27",'
                + '"date":"' + observationDate + '",'
                + '"value":"' + value + '"'
            + '}]'
        + '}';
    }

    public static String emptyObservationsBody() {
        return '{"count":0,"offset":0,"limit":1,"observations":[]}';
    }

    public static String errorBody() {
        return '{"error_code":400,"error_message":"Bad Request. The value for variable api_key is not registered."}';
    }
}