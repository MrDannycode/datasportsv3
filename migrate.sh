#!/bin/bash
cd /home/lnxd25iulie/cti/datasportsv3
yes | ./node_modules/.bin/prisma migrate dev --name add_competitions
