from bigchaindb_driver import BigchainDB

bdb = BigchainDB('http://localhost:9984')
print(bdb.info())
