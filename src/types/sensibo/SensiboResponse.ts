export default interface SensiboResponse {
  status: string;
  result: {
    acState: {
      timestamp: {
        time: string;
        secondsAgo: number;
      };
      on: boolean;
      mode: "auto" | "cool" | "dry" | "fan" | "heat";
      fanLevel: "auto" | "high" | "low" | "medium" | "quiet" | "string";
      swing: "rangeFull" | "stopped";
      light: "off" | "on";
    };
    measurements: {
      time: {
        time: string;
        secondsAgo: number;
      };
      temperature: number;
      humidity: number;
      feelsLike: number;
      rssi: number;
    };
  };
}
