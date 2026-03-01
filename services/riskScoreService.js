exports.calculateRiskScore = ({
  rainfall,
  temperature,
  ndviBefore,
  ndviAfter,
  aiConfidence,
  isHighRiskZone,
}) => {
  let weatherScore = 0;
  let ndviScore = 0;
  let aiScore = 0;
  let zoneScore = 0;

  /* WEATHER */
  if (rainfall > 50) weatherScore = 30;
  else if (rainfall > 20) weatherScore = 20;
  else if (rainfall > 5) weatherScore = 10;
  else if (temperature > 40) weatherScore = 25;

  /* NDVI */
  const ndviDropPercent =
    ((ndviBefore - ndviAfter) / ndviBefore) * 100;

  if (ndviDropPercent > 40) ndviScore = 30;
  else if (ndviDropPercent > 20) ndviScore = 20;
  else if (ndviDropPercent > 10) ndviScore = 10;

  /* AI */
  if (aiConfidence > 0.85) aiScore = 25;
  else if (aiConfidence > 0.7) aiScore = 18;
  else if (aiConfidence > 0.5) aiScore = 10;

  /* ZONE */
  if (isHighRiskZone) zoneScore = 15;

  const totalScore =
    weatherScore + ndviScore + aiScore + zoneScore;

  return {
    totalScore,
    ndviDropPercent,
  };
};