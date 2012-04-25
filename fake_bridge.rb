require 'rubygems'
require 'amqp'
EventMachine.run do
  connection = AMQP.connect
  channel  = AMQP::Channel.new(connection)
  exchange = channel.topic('transactions')
  exchange.publish('{"transaction_key": "test_key","message": {"one":1,"two":2}}', :routing_key => 'transactions.test_session_id2')
end
