// Publicly visible hospitals: legacy/seeded hospitals with no account profile,
// or hospitals with an APPROVED profile. Rejected and pending hospitals are hidden.
const publicHospitalWhere = {
  OR: [
    { hospitalProfiles: { none: {} } },
    { hospitalProfiles: { some: { status: 'APPROVED' } } },
  ],
};

module.exports = { publicHospitalWhere };