import { forwardTo } from 'prisma-binding'

import {
    checkAuth,
    Context,
    getAttribute,
    getUserId,
    getUserType,
    PermissionError,
} from '../../utils'

export const arkhn = {
    async createDatabase(parent, {databaseName }, context: Context) {
        getUserId(context)

        return await context.client.createDatabase({
            name: databaseName,
        })
    },
    // createInputColumnViaAttribute et deleteInputColumnViaAttribute
    // sont construite de sorte à créer ou supprimer une inputColumn
    // à travers son attribut parent directement.
    // Cela permet que ce genre d'évènement (création, suppression)
    // soit pris en compte lors d'une subscription à l'attribut parent.
    // Une issue parle de ça ici : https://github.com/prisma/prisma/issues/146
    async createInputColumnAndUpdateAttribute(parent, { attributeId, data }, context: Context) {
        getUserId(context)

        // Création de la nouvelle inputColumn
        const inputColumn = await context.client.createInputColumn({
            ...data,
            attribute: {
                connect: {
                    id: attributeId,
                }
            }
        })

        // On update manuellement l'Attribut, sans rien modifier
        // ce qui permet de déclencher un évènement
        // pour les souscripteurs.
        const attribute = await context.client.updateAttribute({
            data: {},
            where: { id: attributeId }
        })

        return inputColumn
    },
    async deleteInputColumnAndUpdateAttribute(parent, { attributeId, inputColumnId }, context: Context) {
        getUserId(context)

        // Suppression d'une inputColumn
        const inputColumn = await context.client.deleteInputColumn({
            id: inputColumnId,
        })

        const attribute = await context.client.updateAttribute({
            data: {},
            where: { id: attributeId }
        })

        return inputColumn
    },
    async createJoinAndUpdateInputColumn(parent, { inputColumnId, data }, context: Context) {
        getUserId(context)

        const join = await context.client.createJoin({
            ...data,
            inputColumn: {
                connect: {
                    id: inputColumnId,
                }
            }
        })

        const inputColumn = await context.client.updateInputColumn({
            data: {},
            where: { id: inputColumnId }
        })

        return join
    },
    async deleteJoinAndUpdateInputColumn(parent, { inputColumnId, joinId }, context: Context) {
        getUserId(context)

        // Suppression d'une inputColumn
        const join = await context.client.deleteJoin({
            id: joinId,
        })

        const inputColumn = await context.client.updateInputColumn({
            data: {},
            where: { id: inputColumnId }
        })

        return join
    },
    updateAttribute: checkAuth(forwardTo('binding')),
    async updateInputColumn(parent, { id, data }, context: Context) {
        getUserId(context)

        return await context.client.updateInputColumn({
            data,
            where: { id }
        })
    },
    async updateJoin(parent, { id, data }, context: Context) {
        getUserId(context)

        return await context.client.updateJoin({
            data,
            where: { id }
        })
    },
    createResourceTreeInDatabase(parent, { databaseId, resourceName }, context: Context) {
        getUserId(context)

        try {
            // TODO: request these files from a server
            let json_query = require(`../../../assets/fhirResources/${resourceName}.json`)

            return context.client.createResource({
                database: { connect: { id: databaseId, } },
                name: resourceName,
                attributes: (<any>json_query).attributes,
            })
        } catch (error) {
            // TODO: return something consistent
            console.log(error)
        }
    },
    createAttributeProfileInAttribute(parent, { parentAttributeId, attributeName, attributeType }, context: Context, info) {
        getUserId(context)

        try {
            // TODO: request these files from a server
            let json_query = require(`../../../assets/fhirResources/${attributeType}.json`)

            return context.client.createAttribute({
                attribute: {
                    connect: {
                        id: parentAttributeId,
                    }
                },
                isProfile: true,
                name: attributeName,
                type: attributeType,
                attributes: (<any>json_query).attributes,
            })
        } catch (error) {
            // TODO: return something consistent
            console.log(error)
        }
    },
    async deleteAttribute(parent, { id }, context: Context, info) {
        const userId = getUserId(context)
        const user = await context.client.user({ id: userId })

        // TODO: check role
        // if (user.role == "ADMIN") {
        //     return context.client.deleteAttribute({ id: id })
        // } else {
        //     throw new PermissionError()
        // }
        return context.client.deleteAttribute({ id: id })
    },
}
