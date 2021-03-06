import { forwardTo } from 'prisma-binding'

import {
    checkAuth,
    Context,
    getUserId,
} from '../utils'

export const Subscription = {
    attribute: {
        subscribe: checkAuth(forwardTo('binding')),
    },
    inputColumn: {
        subscribe: checkAuth(forwardTo('binding')),
    },
    join: {
        subscribe: checkAuth(forwardTo('binding')),
    },
}
