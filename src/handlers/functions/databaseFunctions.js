module.exports = (client) => {
    client.createChannelSetup = async function (Schema, channel, interaction) {
        Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
            if (data) {
                data.Channel = channel.id;
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    Channel: channel.id
                }).save();
            }
        });

        client.succNormal({
            text: `¡El canal se configuró correctamente!`,
            fields: [
                {
                    name: `📘┆Canal`,
                    value: `${channel} (${channel.id})`
                }
            ],
            type: 'editreply'
        }, interaction);
    }

    client.createRoleSetup = async function (Schema, role, interaction) {
        Schema.findOne({ Guild: interaction.guild.id }).then(async (data) => {
            if (data) {
                data.Role = role.id;
                data.save();
            }
            else {
                new Schema({
                    Guild: interaction.guild.id,
                    Role: role.id
                }).save();
            }
        });

        client.succNormal({
            text: `¡El rol se configuró correctamente!`,
            fields: [
                {
                    name: `📘┆Rol`,
                    value: `${role} (${role.id})`
                }
            ],
            type: 'editreply'
        }, interaction);
    }
}