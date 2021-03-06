/*
 * Copyright 2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { safeDump, safeLoad } from 'js-yaml'
import { kubectlApplyRule } from './traffic-split'
import { MetricTypes } from '../modes/get-metrics'
import { Arguments } from '@kui-shell/core'
import { removeExtraneousMetaData } from './metric-config'

export default function deleteMetric(configMap: any, metricName: string, type: MetricTypes, args: Arguments): boolean {
  try {
    // const { configMap, counterMetrics, ratioMetrics } = getMetricConfig(args)
    const counterMetrics = safeLoad(configMap.data['counter_metrics.yaml'])
    const ratioMetrics = safeLoad(configMap.data['ratio_metrics.yaml'])
    const newConfigMap = removeExtraneousMetaData(configMap)
    console.log(`Deleting metric: ${metricName} Type: ${type}`)
    newConfigMap.data['counter_metrics.yaml'] = safeDump(
      counterMetrics.filter(counterMetric => counterMetric.name !== metricName)
    )
    newConfigMap.data['ratio_metrics.yaml'] = safeDump(
      ratioMetrics.filter(ratioMetric => ratioMetric.name !== metricName)
    )

    kubectlApplyRule(newConfigMap, args)

    return true
  } catch (err) {
    return false
  }
}
