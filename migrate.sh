#!/bin/bash
cd /home/danxlnx/cti/datasportsv3
yes | ./node_modules/.bin/prisma migrate dev --name add_competitions
