-- @name: my_first_plugin
-- @commands: hello
-- @global: false

function on_command(msg)
    bot.reply(msg.chat, "Hello from my plugin!", msg.id, msg.sender)
end
