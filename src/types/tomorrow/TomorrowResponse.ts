interface Interval {
  startTime: string;
  values: {
    temperature: number;
    temperatureApparent: number;
  };
}

interface Timeline {
  timestep: string;
  startTime: string;
  endTime: string;
  intervals: Interval[];
}

export default interface TomorrowResponse {
  data: {
    timelines: Timeline[];
  };
}
