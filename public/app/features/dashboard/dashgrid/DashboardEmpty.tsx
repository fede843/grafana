import { css, cx } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, PanelModel } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config, locationService, reportInteraction } from '@grafana/runtime';
import { Panel } from '@grafana/schema';
import { Button, useStyles2, Text, TextArea, LoadingPlaceholder } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { DashboardModel } from 'app/features/dashboard/state';
import {
  onAddLibraryPanel,
  onCreateNewPanel,
  onCreateNewRow,
  onGenerateDashboardWithAI,
  onGenerateDashboardWithSemanticSearch,
} from 'app/features/dashboard/utils/dashboard';
import { useDispatch, useSelector } from 'app/types';

import { setInitialDatasource } from '../state/reducers';

export interface Props {
  dashboard: DashboardModel;
  canCreate: boolean;
}

const DashboardEmpty = ({ dashboard, canCreate }: Props) => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();
  const initialDatasource = useSelector((state) => state.dashboard.initialDatasource);
  const [assitsDescription, setAssitsDescription] = React.useState('');
  const [assitsLoading, setAssitsLoading] = React.useState(false);

  const onGenerateDashboard = async () => {
    setAssitsLoading(true);
    try {
      const generatedDashboard = await onGenerateDashboardWithAI(assitsDescription);
      if (generatedDashboard?.panels) {
        generatedDashboard?.panels.forEach((panel: Panel) => {
          dashboard.addPanel(panel);
        });
      }
    } catch (err) {
      // @TODO: Show error in the UI
      console.log(err);
    }
    setAssitsLoading(false);
  };

  const onSearchDashboard = async () => {
    setAssitsLoading(true);
    const bestDashboardMatch = await onGenerateDashboardWithSemanticSearch(assitsDescription);

    setAssitsLoading(false);
    const bestDashboardMatchModel = new DashboardModel(bestDashboardMatch);

    // @TODO: Update title
    // @TODO: Update variables
    // @TODO: Update update annotations
    // @TODO: Should we create the dashboard first, like import does and then load it through URL?
    if (bestDashboardMatchModel?.panels) {
      bestDashboardMatchModel?.panels.forEach((panel: PanelModel) => {
        dashboard.addPanel(panel);
      });
    }
  };

  return (
    <div className={styles.centeredContent}>
      <div className={cx(styles.centeredContent, styles.wrapper)}>
        {/* DashGPT */}
        <div className={cx(styles.containerBox, styles.centeredContent, styles.assistAIContainer)}>
          <div className={styles.headerBig}>
            <Text element="h1" textAlignment="center" weight="medium">
              DashGPT can create a dashboard for you
            </Text>
          </div>
          <div className={cx(styles.centeredContent, styles.bodyBig, styles.assistAIBody)}>
            <Text element="p" textAlignment="center" color="secondary">
              Tell us what your dashboard is about - for example, &quot;I want a dashboard where I can see an overview
              of my Kubernetes cluster.&quot;
            </Text>
            <TextArea
              placeholder="Tell us something"
              width={200}
              onChange={(e) => setAssitsDescription(e.currentTarget.value)}
              value={assitsDescription}
            />
            <Button
              size="md"
              icon="ai"
              data-testid={selectors.pages.AddDashboard.itemButton('Create new panel button')}
              onClick={onGenerateDashboard}
              disabled={assitsLoading}
            >
              {assitsLoading ? (
                <LoadingPlaceholder text="Generating response" className={styles.loadingPlaceholder} />
              ) : (
                'Generate dashboard with DashGPT'
              )}
            </Button>
            <Button
              size="md"
              icon="ai"
              data-testid={selectors.pages.AddDashboard.itemButton('Create new panel button')}
              onClick={onSearchDashboard}
              disabled={assitsLoading}
            >
              {assitsLoading ? (
                <LoadingPlaceholder text="Generating response" className={styles.loadingPlaceholder} />
              ) : (
                'Generate dashboard with templates'
              )}
            </Button>
          </div>
        </div>

        <div className={cx(styles.containerBox, styles.centeredContent, styles.visualizationContainer)}>
          <div className={styles.headerBig}>
            <Text element="h2" textAlignment="center" weight="medium">
              <Trans i18nKey="dashboard.empty.add-visualization-header">
                Start your new dashboard by adding a visualization
              </Trans>
            </Text>
          </div>
          <div className={styles.bodyBig}>
            <Text element="p" textAlignment="center" color="secondary">
              <Trans i18nKey="dashboard.empty.add-visualization-body">
                Select a data source and then query and visualize your data with charts, stats and tables or create
                lists, markdowns and other widgets.
              </Trans>
            </Text>
          </div>
          <Button
            size="md"
            icon="plus"
            fill="outline"
            data-testid={selectors.pages.AddDashboard.itemButton('Create new panel button')}
            onClick={() => {
              const id = onCreateNewPanel(dashboard, initialDatasource);
              reportInteraction('dashboards_emptydashboard_clicked', { item: 'add_visualization' });
              locationService.partial({ editPanel: id, firstPanel: true });
              dispatch(setInitialDatasource(undefined));
            }}
            disabled={!canCreate}
          >
            <Trans i18nKey="dashboard.empty.add-visualization-button">Add visualization</Trans>
          </Button>
        </div>

        <div className={cx(styles.centeredContent, styles.others)}>
          {config.featureToggles.vizAndWidgetSplit && (
            <div className={cx(styles.containerBox, styles.centeredContent, styles.widgetContainer)}>
              <div className={styles.headerSmall}>
                <Text element="h3" textAlignment="center" weight="medium">
                  <Trans i18nKey="dashboard.empty.add-widget-header">Add a widget</Trans>
                </Text>
              </div>
              <div className={styles.bodySmall}>
                <Text element="p" textAlignment="center" color="secondary">
                  <Trans i18nKey="dashboard.empty.add-widget-body">Create lists, markdowns and other widgets</Trans>
                </Text>
              </div>
              <Button
                icon="plus"
                fill="outline"
                data-testid={selectors.pages.AddDashboard.itemButton('Create new widget button')}
                onClick={() => {
                  reportInteraction('dashboards_emptydashboard_clicked', { item: 'add_widget' });
                  locationService.partial({ addWidget: true });
                }}
                disabled={!canCreate}
              >
                <Trans i18nKey="dashboard.empty.add-widget-button">Add widget</Trans>
              </Button>
            </div>
          )}
          <div className={cx(styles.containerBox, styles.centeredContent, styles.rowContainer)}>
            <div className={styles.headerSmall}>
              <Text element="h3" textAlignment="center" weight="medium">
                <Trans i18nKey="dashboard.empty.add-row-header">Add a row</Trans>
              </Text>
            </div>
            <div className={styles.bodySmall}>
              <Text element="p" textAlignment="center" color="secondary">
                <Trans i18nKey="dashboard.empty.add-row-body">
                  Group your visualizations into expandable sections.
                </Trans>
              </Text>
            </div>
            <Button
              icon="plus"
              fill="outline"
              data-testid={selectors.pages.AddDashboard.itemButton('Create new row button')}
              onClick={() => {
                reportInteraction('dashboards_emptydashboard_clicked', { item: 'add_row' });
                onCreateNewRow(dashboard);
              }}
              disabled={!canCreate}
            >
              <Trans i18nKey="dashboard.empty.add-row-button">Add row</Trans>
            </Button>
          </div>
          <div className={cx(styles.containerBox, styles.centeredContent, styles.libraryContainer)}>
            <div className={styles.headerSmall}>
              <Text element="h3" textAlignment="center" weight="medium">
                <Trans i18nKey="dashboard.empty.add-import-header">Import panel</Trans>
              </Text>
            </div>
            <div className={styles.bodySmall}>
              <Text element="p" textAlignment="center" color="secondary">
                <Trans i18nKey="dashboard.empty.add-import-body">
                  Import visualizations that are shared with other dashboards.
                </Trans>
              </Text>
            </div>
            <Button
              icon="plus"
              fill="outline"
              data-testid={selectors.pages.AddDashboard.itemButton('Add a panel from the panel library button')}
              onClick={() => {
                reportInteraction('dashboards_emptydashboard_clicked', { item: 'import_from_library' });
                onAddLibraryPanel(dashboard);
              }}
              disabled={!canCreate}
            >
              <Trans i18nKey="dashboard.empty.add-import-button">Import library panel</Trans>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEmpty;

function getStyles(theme: GrafanaTheme2) {
  return {
    wrapper: css({
      label: 'dashboard-empty-wrapper',
      flexDirection: 'column',
      maxWidth: '890px',
      gap: theme.spacing.gridSize * 4,
      paddingTop: theme.spacing(2),

      [theme.breakpoints.up('sm')]: {
        paddingTop: theme.spacing(12),
      },
    }),
    containerBox: css({
      label: 'container-box',
      flexDirection: 'column',
      boxSizing: 'border-box',
      border: '1px dashed rgba(110, 159, 255, 0.5)',
      margin: 0,
    }),
    centeredContent: css({
      label: 'centered',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    visualizationContainer: css({
      label: 'visualization-container',
      padding: theme.spacing.gridSize * 4,
    }),
    others: css({
      width: '100%',
      label: 'others-wrapper',
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: theme.spacing.gridSize * 4,

      [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
      },
    }),
    assistAIContainer: css({
      label: 'assist-ai-container',
      padding: theme.spacing.gridSize * 3,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    assistAIBody: css({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.gridSize * 2,
    }),
    widgetContainer: css({
      label: 'widget-container',
      padding: theme.spacing.gridSize * 3,
      flex: 1,
    }),
    rowContainer: css({
      label: 'row-container',
      padding: theme.spacing.gridSize * 3,
      flex: 1,
    }),
    libraryContainer: css({
      label: 'library-container',
      padding: theme.spacing.gridSize * 3,
      flex: 1,
    }),
    headerBig: css({
      marginBottom: theme.spacing.gridSize * 2,
    }),
    headerSmall: css({
      marginBottom: theme.spacing.gridSize,
    }),
    bodyBig: css({
      maxWidth: '75%',
      marginBottom: theme.spacing.gridSize * 4,
    }),
    bodySmall: css({
      marginBottom: theme.spacing.gridSize * 3,
    }),
    loadingPlaceholder: css({
      marginBottom: 0,
    }),
  };
}
