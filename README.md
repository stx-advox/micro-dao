# MicroDAO
A simple dao implementation for micro tasks

A micro DAO or an mDAO for short allows small teams (ideally 2-8) to pay themselves in STX through a simple consensus based funding proposals

mDAOs have a discord front end bot that anybody can invite through [here](https://discord.com/oauth2/authorize?client_id=957992867954045059&permissions=0&scope=bot%20applications.commands)
,

## Features

### Deposit 

The first step and a prerequisite for any action is to have money in the first place, anybody can call this function to deposit any amount of STX, this can be internal team putting money in a pot together or an external supporter of the mDAO

### Create a funding proposal

The main function of the mDAO implementation is to distribute funds to its members or to send funds to someone who contributed to the mDAO's goals

Creating a funding proposal would require:
- at least a list of at least one grantee with the amount of the grant, up 10 grantee and grant couple like ('SP..., 10STX', 'SP..., 20STX', ....)
- a description of the grant that could be a link to a document hosted on ipfs or something similar
- the proposer to be a member of the mDAO
- The mDAO to have sufficient funds matching the total of the grants

If all of the conditions are satisified then the proposal would be created and the dissent period gets activated

The dissent period is a number of Bitcoin (not stacks!) blocks before a proposal could be executed

There are no member addition or removal functions avaialbe, to change the membership of the mDAO you have to create a different mDAO contract and transfer your funds to the new mDAO contract

Members of the mDAO are hardcoded in the contract as STX principals, in practice other contracts can be members of an mDAO but this feature is yet to be speced out 

### Dissent

Part of the consensus process is to either passively consent or actively dissent, if a proposal has dissent it is considered failed and will not be executed, this power is granted to any member of the mDAO, this is an based on the Stacks Gov Lab's [Consensus Flow Spec](https://paper.dropbox.com/doc/Consensus-Flow-Spec--BfS6qyetsEngXItFDPu~ahdQAg-aH31HqPN1545yixaAexam) 

This implementation is opinionated for simplicity and high trust small teams, that make decisions collectively, the meta governance of such small circles is still work in progress for cross mDAO collaboration through a theortical metaDAO implementation

The only requirement of dissent is for the dissenter to be a member of the mDAO

## Execute a funding proposal

If the proposal passes the constant dissent period it is considered executable by any member of the mDAO, the funds are sent for the grantees if the mDAO has sufficient funds


