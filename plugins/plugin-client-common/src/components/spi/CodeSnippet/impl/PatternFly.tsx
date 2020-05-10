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

import * as React from 'react'
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core'

import Props from '../model'
import needsMultiLine from './needs-multi-line'

import '../../../../../web/scss/components/CodeSnippet/PatternFly.scss'

export default class PatternFlyCodeSnippet extends React.PureComponent<Props> {
  public render() {
    return (
      <ClipboardCopy
        isReadOnly
        isCode
        isExpanded={needsMultiLine(this.props.value)}
        variant={ClipboardCopyVariant.expansion}
        onCopy={this.props.onCopy}
      >
        {this.props.value}
      </ClipboardCopy>
    )
  }
}