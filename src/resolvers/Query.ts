import * as jwt from 'jsonwebtoken'
import { forwardTo } from 'prisma-binding'

import {
    checkAuth,
    Context,
    getUserId,
    getRecAttribute,
} from '../utils'

export const Query = {
    // BINDING QUERIES
    inputColumns: checkAuth(forwardTo('binding')),
    resource: checkAuth(forwardTo('binding')),

    // CLIENT QUERIES
    allDatabases(parent, args, context: Context) {
        getUserId(context)

        return context.client.databases()
    },
    availableResources(parent, { databaseId }, context: Context) {
        getUserId(context)

        return context.client.database({ id: databaseId }).resources()
    },
    async recAvailableAttributes(parent, { resourceId }, context: Context) {
        getUserId(context)

        const directAttributes = await context.client
            .resource({ id: resourceId })
            .attributes()

        return directAttributes.map(async (attribute) => {
            return {
                ...attribute,
                attributes: await getRecAttribute(attribute, context),
            }
        })
    },
    me(parent, args, context: Context) {
        const id = getUserId(context)

        return context.client.user({ id })
    },
    isAuthenticated(parent, args, context: Context) {
        console.log('isAuthenticated')
        const Authorization = context.request ?
            context.request.get('Authorization') :
            (context.connection.context.Authorization || null)

        if (Authorization) {
            const token = Authorization.replace('Bearer ', '')

            try {
                const { userId } = jwt.verify(token, process.env.APP_SECRET) as { userId: string }
            } catch (e) {
                return false
            }

            return true
        }

        return false
    },
    async computeDatabaseMappingProgress(parent, { databaseId }, context: Context) {

        getUserId(context)

        // need to catch all graph, has to be long enough
        const mydatabase =  await context.binding.request("query { database( where: {id: \""+databaseId+"\"})  { id name resources{ id name attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } attributes{ id name inputColumns{ id } } } } } } } } } } } } } } } } } } } } }")

        const resources = mydatabase["data"]["database"]["resources"]

        const numberMappedRessources = resources.length

        const recFunction = (attribute) => {
            const inputColumns = attribute["inputColumns"]

            if (inputColumns.length > 0) {
                return 1
            } else {
                const attributes = attribute["attributes"]

                return attributes.reduce(
                    (accumulator, attribute) => accumulator + recFunction(attribute),
                    0
                )

            }
        }

        // loop over all ressources and all attributes within. Apply recFunction and sum all.
        const numberMappedAttributes = resources.reduce(
            (accumulator, resource) => accumulator + resource["attributes"].reduce(
                (accumulator, attribute) => accumulator + recFunction(attribute),
                0
            ),
            0
        )

        return [numberMappedRessources, numberMappedAttributes]
    },
}
