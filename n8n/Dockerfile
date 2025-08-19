FROM n8nio/n8n:latest

USER root
COPY ./workflows /workflows
RUN chown -R node:node /workflows
USER node

EXPOSE 5678

CMD ["start"]