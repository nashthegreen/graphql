export const USER_ID_QUERY = `
  query {
    user {
      id
    }
  }
`;

export const PROFILE_QUERY = `
  query ProfileData($userId: Int!, $xpPath: String!, $xpExclude: String!) {
    user {
      id
      login
      firstName
      lastName
      email
      auditRatio
      totalUp
      totalDown
    }
    profile: user_by_pk(id: $userId) {
      id
      login
      firstName
      lastName
      email
    }
    xpTransactions: transaction(
      where: {
        type: { _eq: "xp" }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
        ]
      }
      order_by: { createdAt: asc }
    ) {
      amount
      createdAt
      user {
        login
      }
    }
    xpTotal: transaction_aggregate(
      where: {
        type: { _eq: "xp" }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
        ]
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    xpUp: transaction_aggregate(
      where: {
        type: { _eq: "xp" }
        amount: { _gt: 0 }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
        ]
      }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
    latestLevel: transaction(
      where: {
        type: { _eq: "level" }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
        ]
      }
      order_by: { createdAt: desc }
      limit: 1
    ) {
      amount
      path
    }
    skills: transaction(
      distinct_on: type
      where: { type: { _like: "skill_%" } }
      order_by: { type: asc, amount: desc }
    ) {
      type
      amount
      object {
        name
        type
      }
    }
    progressDone: progress_aggregate(where: { isDone: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`;
