export const USER_ID_QUERY = `
  query {
    user {
      id
    }
  }
`;

export const PROFILE_QUERY = `
  query ProfileData(
    $userId: Int!
    $xpPath: String!
    $xpExclude: String!
    $xpExcludeGo: String!
    $levelPath: String!
    $modulePath: String!
  ) {
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
    finishedGroups: group(
      where: {
        status: { _eq: finished }
        members: { userId: { _eq: $userId } }
      }
    ) {
      status
      members {
        userId
        userLogin
        user {
          login
        }
      }
    }
    xpTransactions: transaction(
      where: {
        type: { _eq: "xp" }
        userId: { _eq: $userId }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
          { path: { _nilike: $xpExcludeGo } }
        ]
      }
      order_by: { createdAt: asc }
    ) {
      amount
      createdAt
      path
    }
    xpUp: transaction_aggregate(
      where: {
        type: { _eq: "xp" }
        userId: { _eq: $userId }
        amount: { _gt: 0 }
        _and: [
          { path: { _like: $xpPath } }
          { path: { _nilike: $xpExclude } }
          { path: { _nilike: $xpExcludeGo } }
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
          { path: { _like: $levelPath } }
          { path: { _nilike: $xpExclude } }
        ]
      }
      order_by: { createdAt: desc }
      limit: 1
    ) {
      amount
    }
    moduleEvent: event_user(
      where: {
        userId: { _eq: $userId }
        event: {
          _or: [
            { path: { _eq: $modulePath } }
            { object: { type: { _eq: "module" } } }
          ]
        }
      }
      order_by: { level: desc }
      limit: 1
    ) {
      level
      event {
        object {
          attrs
        }
      }
    }
    moduleObject: object(
      where: {
        type: { _eq: "module" }
        name: { _eq: "bh-module" }
      }
      limit: 1
    ) {
      attrs
    }
    skills: transaction(
      distinct_on: type
      where: { type: { _like: "skill_%" } }
      order_by: { type: asc, amount: desc }
    ) {
      type
      amount
    }
  }
`;
