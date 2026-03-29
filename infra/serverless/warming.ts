export const warmingEvent = {
  schedule: {
    rate: ['rate(5 minutes)'],
    input: {
      source: 'serverless-warming',
    },
  },
};
