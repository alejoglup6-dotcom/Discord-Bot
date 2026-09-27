const Discord = require('discord.js');

/** 
 * Easy to send errors because im lazy to do the same things :p
 * @param {String} text - Message which is need to send
 * @param {TextChannel} channel - A Channel to send error
 */

const Schema = require("../../database/models/functions");

module.exports = (client) => {
    client.templateEmbed = function () {
        return new Discord.EmbedBuilder()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.avatarURL({ size: 1024 })
            })
            .setColor(client.config.colors.normal)
            .setFooter({
                text: client.config.discord.footer,
                iconURL: client.user.avatarURL({ size: 1024 })
            })
            .setTimestamp();
    }

    //----------------------------------------------------------------//
    //                        ERROR MESSAGES                          //
    //----------------------------------------------------------------//

    // Normal error 
    client.errNormal = async function ({
        embed: embed = client.templateEmbed(),
        error: error,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・¡Error!`)
        embed.setDescription(`¡Algo salió mal!`)
        embed.addFields( 
            { name: "💬┆Detalle del error", value: `\`\`\`${error}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Missing args
    client.errUsage = async function ({
        embed: embed = client.templateEmbed(),
        usage: usage,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・¡Error!`)
        embed.setDescription(`No indicaste los argumentos correctos`)
        embed.addFields(
            { name: "💬┆Argumentos necesarios", value: `\`\`\`${usage}\`\`\``},    
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Missing perms

    client.errMissingPerms = async function ({
        embed: embed = client.templateEmbed(),
        perms: perms,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・¡Error!`)
        embed.setDescription(`No tienes los permisos necesarios`)
        embed.addFields(
            { name: "🔑┆Permiso necesario", value: `\`\`\`${perms}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // No bot perms

    client.errNoPerms = async function ({
        embed: embed = client.templateEmbed(),
        perms: perms,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・¡Error!`)
        embed.setDescription(`No tengo los permisos necesarios`)
        embed.addFields(
            { name: "🔑┆Permiso necesario", value: `\`\`\`${perms}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Wait error

    client.errWait = async function ({
        embed: embed = client.templateEmbed(),
        time: time,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・¡Error!`)
        embed.setDescription(`Ya hiciste esto una vez`)
        embed.addFields(
            { name: "⏰┆Vuelve a intentarlo el", value: `<t:${time}:f>`},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    //----------------------------------------------------------------//
    //                        SUCCES MESSAGES                         //
    //----------------------------------------------------------------//

    // Normal succes
    client.succNormal = async function ({
        embed: embed = client.templateEmbed(),
        text: text,
        fields: fields,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.check}・¡Listo!`)
        embed.setDescription(`${text}`)
        embed.setColor(client.config.colors.succes)

        if (fields) embed.addFields(fields);

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    //----------------------------------------------------------------//
    //                        BASIC MESSAGES                          //
    //----------------------------------------------------------------//

    // Default
    client.embed = async function ({
        embed: embed = client.templateEmbed(),
        title: title,
        desc: desc,
        color: color,
        image: image,
        author: author,
        url: url,
        footer: footer,
        thumbnail: thumbnail,
        fields: fields,
        content: content,
        components: components,
        files: files,
        type: type
    }, interaction) {
        // El canal de destino puede no existir (por ejemplo, un canal de registros borrado)
        if (!interaction) return;
        const functiondata = interaction.guild ? await Schema.findOne({ Guild: interaction.guild.id }) : null;

        if (title) embed.setTitle(title);
        if (desc && desc.length >= 2048) embed.setDescription(desc.substr(0, 2044) + "...");
        else if (desc) embed.setDescription(desc);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (fields) embed.addFields(fields);
        if (author) embed.setAuthor(author);
        if (url) embed.setURL(url);
        if (footer) embed.setFooter({ text: footer });
        if (color) embed.setColor(color);
        if (functiondata && functiondata.Color && !color) embed.setColor(functiondata.Color)
        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            files: files,
            type: type
        }, interaction)
    }

    client.simpleEmbed = async function ({
        title: title,
        desc: desc,
        color: color,
        image: image,
        author: author,
        thumbnail: thumbnail,
        fields: fields,
        url: url,
        content: content,
        components: components,
        type: type
    }, interaction) {
        if (!interaction) return;
        const functiondata = interaction.guild ? await Schema.findOne({ Guild: interaction.guild.id }) : null;

        let embed = new Discord.EmbedBuilder()
            .setColor(client.config.colors.normal)

        if (title) embed.setTitle(title);
        if (desc && desc.length >= 2048) embed.setDescription(desc.substr(0, 2044) + "...");
        else if (desc) embed.setDescription(desc);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (fields) embed.addFields(fields);
        if (author) embed.setAuthor(author);
        if (url) embed.setURL(url);
        if (color) embed.setColor(color);
        if (functiondata && functiondata.Color && !color) embed.setColor(functiondata.Color)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    client.sendEmbed = async function ({
        embeds: embeds,
        content: content,
        components: components,
        files: files,
        type: type
    }, interaction) {
        if (!interaction) return;

        // Si la interacción ya se aplazó, una respuesta nueva fallaría: se edita la existente
        if (type && ["reply", "ephemeral"].includes(type.toLowerCase()) && (interaction.deferred || interaction.replied)) {
            type = "editreply";
        }

        if (type && type.toLowerCase() == "edit") {
            return await interaction.edit({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "editreply") {
            return await interaction.editReply({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "reply") {
            return await interaction.reply({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "update") {
            return await interaction.update({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "ephemeraledit") {
            return await interaction.editReply({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true,
                flags: Discord.MessageFlags.Ephemeral
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "ephemeral") {
            return await interaction.reply({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true,
                flags: Discord.MessageFlags.Ephemeral
            }).catch(e => { });
        }
        else {
            return await interaction.send({
                embeds: embeds,
                content: content,
                components: components,
                files: files,
                withResponse: true
            }).catch(e => { });
        }
    }
}

 