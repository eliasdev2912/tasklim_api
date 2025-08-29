const pool = require('../../../../database')

const { AppError } = require('../../../utilities/errorsUtilities')
const createMemberInstance = require('../../member_instances/actions/createMemberInstance')
const createNewTable = require('../../tables/actions/createNewTable')

const createSpace = async (userId, spaceName, spaceDescription) => {
  const client = await pool.connect()

  try {
    //Crear space
    await client.query('BEGIN')

    const spaceQuery = `
      INSERT INTO spaces (space_name, space_description)
      VALUES ($1, $2)
      RETURNING space_name, space_description, id
    `

    const result = await client.query(spaceQuery, [spaceName, spaceDescription]);
    const newSpace = result.rows[0];

    if (!newSpace) throw new AppError('Error creating space')

    // Crear tres tablas (TODO, DOING, DONE)

    const newTable0 = await createNewTable(newSpace.id, 'to do', client)
    const newTable1 = await createNewTable(newSpace.id, 'doing', client)
    const newTable2 = await createNewTable(newSpace.id, 'done', client)

    const newTables = [newTable0, newTable1, newTable2]

    if (!newTables || newTables.length !== 3 /* SIEMPRE DEBE CREAR 3 TABLAS */) {
      await client.query('ROLLBACK')
      throw new AppError('Error creating space tables')
    }

    // Crear memberIntance
    const newMemberInstance = await createMemberInstance(userId, newSpace.id, 'admin', client)

    if (!newMemberInstance) {
      await client.query('ROLLBACK')
      throw new AppError('Error creating initial space member instance')
    }

    await client.query('COMMIT')

    return { newSpace, newMemberInstance, newTables }

  } catch (err) {
    throw err
  } finally {
    client.release()
  }
}

module.exports = createSpace